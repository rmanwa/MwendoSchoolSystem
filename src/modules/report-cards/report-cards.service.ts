import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

import { ReportCard, ReportCardStatus, SubjectResult, ReportCardSummary } from '../../database/entities/report-card.entity';
import { Student } from '../../database/entities/student.entity';
import { Class } from '../../database/entities/class.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Exam } from '../../database/entities/exam.entity';
import { Term } from '../../database/entities/term.entity';
import { AcademicYear } from '../../database/entities/academic-year.entity';
import { Attendance, AttendanceStatus } from '../../database/entities/attendance.entity';
import { FeeInvoice } from '../../database/entities/fee-invoice.entity';

import {
  GenerateReportCardDto,
  BulkGenerateReportCardsDto,
  UpdateReportCardCommentsDto,
  ReportCardQueryDto,
} from './dto/report-card.dto';

/**
 * REPORT CARDS SERVICE - PRODUCTION READY
 * =======================================
 */

// Grading systems (same as exams service)
interface GradeScale {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  points: number;
  description: string;
}

const GRADING_SYSTEMS: Record<string, GradeScale[]> = {
  '8-4-4': [
    { grade: 'A', minPercentage: 80, maxPercentage: 100, points: 12, description: 'Excellent' },
    { grade: 'A-', minPercentage: 75, maxPercentage: 79.99, points: 11, description: 'Very Good' },
    { grade: 'B+', minPercentage: 70, maxPercentage: 74.99, points: 10, description: 'Good' },
    { grade: 'B', minPercentage: 65, maxPercentage: 69.99, points: 9, description: 'Good' },
    { grade: 'B-', minPercentage: 60, maxPercentage: 64.99, points: 8, description: 'Fairly Good' },
    { grade: 'C+', minPercentage: 55, maxPercentage: 59.99, points: 7, description: 'Average' },
    { grade: 'C', minPercentage: 50, maxPercentage: 54.99, points: 6, description: 'Average' },
    { grade: 'C-', minPercentage: 45, maxPercentage: 49.99, points: 5, description: 'Below Average' },
    { grade: 'D+', minPercentage: 40, maxPercentage: 44.99, points: 4, description: 'Below Average' },
    { grade: 'D', minPercentage: 35, maxPercentage: 39.99, points: 3, description: 'Weak' },
    { grade: 'D-', minPercentage: 30, maxPercentage: 34.99, points: 2, description: 'Weak' },
    { grade: 'E', minPercentage: 0, maxPercentage: 29.99, points: 1, description: 'Very Weak' },
  ],
  'CBC': [
    { grade: 'EE', minPercentage: 80, maxPercentage: 100, points: 4, description: 'Exceeds Expectations' },
    { grade: 'ME', minPercentage: 65, maxPercentage: 79.99, points: 3, description: 'Meets Expectations' },
    { grade: 'AE', minPercentage: 50, maxPercentage: 64.99, points: 2, description: 'Approaching Expectations' },
    { grade: 'BE', minPercentage: 0, maxPercentage: 49.99, points: 1, description: 'Below Expectations' },
  ],
  'CAMBRIDGE': [
    { grade: 'A*', minPercentage: 90, maxPercentage: 100, points: 9, description: 'Outstanding' },
    { grade: 'A', minPercentage: 80, maxPercentage: 89.99, points: 8, description: 'Excellent' },
    { grade: 'B', minPercentage: 70, maxPercentage: 79.99, points: 7, description: 'Very Good' },
    { grade: 'C', minPercentage: 60, maxPercentage: 69.99, points: 6, description: 'Good' },
    { grade: 'D', minPercentage: 50, maxPercentage: 59.99, points: 5, description: 'Satisfactory' },
    { grade: 'E', minPercentage: 40, maxPercentage: 49.99, points: 4, description: 'Sufficient' },
    { grade: 'F', minPercentage: 30, maxPercentage: 39.99, points: 3, description: 'Low' },
    { grade: 'G', minPercentage: 20, maxPercentage: 29.99, points: 2, description: 'Very Low' },
    { grade: 'U', minPercentage: 0, maxPercentage: 19.99, points: 0, description: 'Ungraded' },
  ],
};

@Injectable()
export class ReportCardsService {
  constructor(
    @InjectRepository(ReportCard)
    private readonly reportCardRepository: Repository<ReportCard>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(FeeInvoice)
    private readonly invoiceRepository: Repository<FeeInvoice>,
  ) {}

  // ==================== HELPER METHODS ====================

  /**
   * Get grade from percentage based on curriculum
   */
  private getGradeFromPercentage(percentage: number, curriculum: string): GradeScale {
    const scales = GRADING_SYSTEMS[curriculum] || GRADING_SYSTEMS['8-4-4'];
    for (const scale of scales) {
      if (percentage >= scale.minPercentage && percentage <= scale.maxPercentage) {
        return scale;
      }
    }
    return scales[scales.length - 1]; // Return lowest grade
  }

  /**
   * Calculate mean grade for 8-4-4 (best 7 subjects)
   */
  private calculateMeanGrade(points: number[]): { meanPoints: number; meanGrade: string } {
    const sorted = [...points].sort((a, b) => b - a);
    const best7 = sorted.slice(0, 7);
    const totalPoints = best7.reduce((sum, p) => sum + p, 0);
    const meanPoints = best7.length > 0 ? totalPoints / best7.length : 0;

    let meanGrade = 'E';
    if (meanPoints >= 11.5) meanGrade = 'A';
    else if (meanPoints >= 10.5) meanGrade = 'A-';
    else if (meanPoints >= 9.5) meanGrade = 'B+';
    else if (meanPoints >= 8.5) meanGrade = 'B';
    else if (meanPoints >= 7.5) meanGrade = 'B-';
    else if (meanPoints >= 6.5) meanGrade = 'C+';
    else if (meanPoints >= 5.5) meanGrade = 'C';
    else if (meanPoints >= 4.5) meanGrade = 'C-';
    else if (meanPoints >= 3.5) meanGrade = 'D+';
    else if (meanPoints >= 2.5) meanGrade = 'D';
    else if (meanPoints >= 1.5) meanGrade = 'D-';

    return { meanPoints: Math.round(meanPoints * 100) / 100, meanGrade };
  }

  /**
   * Get rank suffix (1st, 2nd, 3rd, 4th...)
   */
  private getRankSuffix(rank: number): string {
    if (rank % 100 >= 11 && rank % 100 <= 13) return `${rank}th`;
    switch (rank % 10) {
      case 1: return `${rank}st`;
      case 2: return `${rank}nd`;
      case 3: return `${rank}rd`;
      default: return `${rank}th`;
    }
  }

  /**
   * Format student name safely
   */
  private formatStudentName(student: Student): string {
    const user = (student as any).user;
    if (!user) return student.admissionNumber || 'Unknown';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
  }

  /**
   * Generate unique report number
   */
  private generateReportNumber(schoolId: string, termId: string, studentNumber: number): string {
    const year = new Date().getFullYear();
    return `RC-${year}-${studentNumber.toString().padStart(4, '0')}`;
  }

  // ==================== REPORT CARD GENERATION ====================

  /**
   * Generate report card for a single student
   */
  async generateReportCard(
    dto: GenerateReportCardDto,
    schoolId: string,
    generatedBy: string,
  ): Promise<ReportCard> {
    // Check if report card already exists
    const existing = await this.reportCardRepository.findOne({
      where: { studentId: dto.studentId, termId: dto.termId, schoolId },
    });

    if (existing && !dto.regenerate) {
      throw new ConflictException('Report card already exists. Set regenerate=true to overwrite.');
    }

    // Get student with relations
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, schoolId },
      relations: ['class', 'user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get term and academic year
    const term = await this.termRepository.findOne({
      where: { id: dto.termId, schoolId },
      relations: ['academicYear'],
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    // Get all grades for this student in this term
    const grades = await this.gradeRepository.find({
      where: { studentId: dto.studentId, schoolId },
      relations: ['exam', 'exam.subject', 'exam.term'],
    });

    const termGrades = grades.filter(g => g.exam?.termId === dto.termId);

    if (termGrades.length === 0) {
      throw new BadRequestException('No grades found for this student in the specified term');
    }

    const curriculum = dto.curriculum || '8-4-4';

    // Group grades by subject
    const subjectMap = new Map<string, { subject: any; grades: Grade[] }>();

    for (const grade of termGrades) {
      const subjectId = grade.exam.subjectId;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: grade.exam.subject,
          grades: [],
        });
      }
      subjectMap.get(subjectId)!.grades.push(grade);
    }

    // Calculate subject results
    const subjectResults: SubjectResult[] = [];
    let totalPercentage = 0;
    let totalPoints = 0;

    for (const [subjectId, data] of subjectMap) {
      const validGrades = data.grades.filter(g => !g.isAbsent && !g.isExempted);

      if (validGrades.length === 0) continue;

      // Calculate weighted average
      let weightedSum = 0;
      let totalWeight = 0;

      const exams = validGrades.map(g => {
        const weight = Number(g.exam.weightPercentage) || 100;
        weightedSum += Number(g.percentage) * weight;
        totalWeight += weight;

        return {
          examId: g.examId,
          examName: g.exam.name,
          examType: g.exam.type,
          marksObtained: Number(g.marksObtained),
          totalMarks: Number(g.exam.totalMarks),
          percentage: Number(g.percentage),
          grade: g.letterGrade,
          weight,
        };
      });

      const averagePercentage = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const gradeInfo = this.getGradeFromPercentage(averagePercentage, curriculum);

      const subjectResult: SubjectResult = {
        subjectId,
        subjectName: data.subject?.name || 'Unknown',
        subjectCode: data.subject?.code,
        exams,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        finalGrade: gradeInfo.grade,
        gradePoints: gradeInfo.points,
      };

      subjectResults.push(subjectResult);
      totalPercentage += averagePercentage;
      totalPoints += gradeInfo.points;
    }

    // Calculate overall summary
    const subjectCount = subjectResults.length;
    const overallPercentage = subjectCount > 0 ? totalPercentage / subjectCount : 0;
    const overallGradeInfo = this.getGradeFromPercentage(overallPercentage, curriculum);

    // Calculate class ranking
    const classRanking = await this.calculateClassRankingForTerm(
      student.classId,
      dto.termId,
      schoolId,
      curriculum,
    );

    const studentRank = classRanking.find(r => r.studentId === dto.studentId);
    const classRank = studentRank?.rank || 0;
    const classSize = classRanking.length;

    // Calculate mean grade for 8-4-4
    let meanGradeInfo: { meanPoints: number; meanGrade: string } | null = null;
    if (curriculum === '8-4-4') {
      const points = subjectResults.map(s => s.gradePoints);
      meanGradeInfo = this.calculateMeanGrade(points);
    }

    const summary: ReportCardSummary = {
      totalSubjects: subjectCount,
      totalMarksObtained: Math.round(totalPercentage * 100) / 100,
      totalMarksPossible: subjectCount * 100,
      overallPercentage: Math.round(overallPercentage * 100) / 100,
      overallGrade: overallGradeInfo.grade,
      totalPoints,
      meanGrade: meanGradeInfo?.meanGrade,
      meanPoints: meanGradeInfo?.meanPoints,
      classRank,
      classRankSuffix: this.getRankSuffix(classRank),
      classSize,
    };

    // Get attendance summary
    const attendance = await this.getAttendanceSummary(dto.studentId, dto.termId, schoolId);

    // Get fee balance (optional)
    let feeBalance: number | null = null;
    if (dto.includeFeeBalance) {
      feeBalance = await this.getFeeBalance(dto.studentId, schoolId);
    }

    // Create or update report card
    const reportCardData = {
      schoolId,
      studentId: dto.studentId,
      classId: student.classId,
      academicYearId: term.academicYearId,
      termId: dto.termId,
      reportNumber: this.generateReportNumber(schoolId, dto.termId, classRank),
      curriculum,
      subjectResults,
      summary,
      daysPresent: attendance.present,
      daysAbsent: attendance.absent,
      totalSchoolDays: attendance.total,
      feeBalance,
      status: ReportCardStatus.DRAFT,
      generatedBy,
    };

    if (existing) {
      Object.assign(existing, reportCardData);
      existing.pdfUrl = null as any; // Reset PDF since data changed
      existing.pdfGeneratedAt = null as any;
      return this.reportCardRepository.save(existing);
    }

    const reportCard = this.reportCardRepository.create(reportCardData);
    return this.reportCardRepository.save(reportCard);
  }

  /**
   * Bulk generate report cards for entire class
   */
  async bulkGenerateReportCards(
    dto: BulkGenerateReportCardsDto,
    schoolId: string,
    generatedBy: string,
  ): Promise<{ total: number; generated: number; skipped: number; errors: any[] }> {
    const students = await this.studentRepository.find({
      where: { classId: dto.classId, schoolId, status: 'active' },
    });

    const results = { total: students.length, generated: 0, skipped: 0, errors: [] as any[] };

    for (const student of students) {
      try {
        await this.generateReportCard(
          {
            studentId: student.id,
            termId: dto.termId,
            curriculum: dto.curriculum,
            includeFeeBalance: dto.includeFeeBalance,
            regenerate: dto.regenerate,
          },
          schoolId,
          generatedBy,
        );
        results.generated++;
      } catch (error: any) {
        if (error instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push({
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Calculate class ranking for a term
   */
  private async calculateClassRankingForTerm(
    classId: string,
    termId: string,
    schoolId: string,
    curriculum: string,
  ): Promise<{ studentId: string; average: number; rank: number }[]> {
    const students = await this.studentRepository.find({
      where: { classId, schoolId, status: 'active' },
    });

    const rankings: { studentId: string; average: number; rank: number }[] = [];

    for (const student of students) {
      const grades = await this.gradeRepository.find({
        where: { studentId: student.id, schoolId },
        relations: ['exam'],
      });

      const termGrades = grades.filter(
        g => g.exam?.termId === termId && !g.isAbsent && !g.isExempted
      );

      if (termGrades.length > 0) {
        const totalPercentage = termGrades.reduce((sum, g) => sum + Number(g.percentage), 0);
        const average = totalPercentage / termGrades.length;

        rankings.push({
          studentId: student.id,
          average: Math.round(average * 100) / 100,
          rank: 0,
        });
      }
    }

    // Sort by average descending
    rankings.sort((a, b) => b.average - a.average);

    // Assign ranks (handle ties)
    let rank = 1;
    let prevAverage = -1;
    let sameRankCount = 0;

    for (const r of rankings) {
      if (r.average === prevAverage) {
        sameRankCount++;
      } else {
        rank += sameRankCount;
        sameRankCount = 1;
      }
      r.rank = rank;
      prevAverage = r.average;
    }

    return rankings;
  }

  /**
   * Get attendance summary for student in a term
   */
  private async getAttendanceSummary(
    studentId: string,
    termId: string,
    schoolId: string,
  ): Promise<{ present: number; absent: number; total: number }> {
    const attendance = await this.attendanceRepository.find({
      where: { studentId, termId, schoolId },
    });

    const present = attendance.filter(
      a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length;
    const absent = attendance.filter(
      a => a.status === AttendanceStatus.ABSENT
    ).length;

    return { present, absent, total: attendance.length };
  }

  /**
   * Get fee balance for student
   */
  private async getFeeBalance(studentId: string, schoolId: string): Promise<number> {
    const invoices = await this.invoiceRepository.find({
      where: { studentId, schoolId },
    });

    return invoices.reduce((sum, inv) => sum + Number((inv as any).balance || 0), 0);
  }

  // ==================== REPORT CARD CRUD ====================

  /**
   * Get all report cards with filters
   */
  async findAll(query: ReportCardQueryDto, schoolId: string): Promise<ReportCard[]> {
    const where: any = { schoolId };

    if (query.studentId) where.studentId = query.studentId;
    if (query.classId) where.classId = query.classId;
    if (query.termId) where.termId = query.termId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.status) where.status = query.status;

    return this.reportCardRepository.find({
      where,
      relations: ['student', 'student.user', 'class', 'term', 'academicYear'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get single report card
   */
  async findOne(id: string, schoolId: string): Promise<ReportCard> {
    const reportCard = await this.reportCardRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'class', 'term', 'academicYear'],
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    return reportCard;
  }

  /**
   * Update report card comments
   */
  async updateComments(
    id: string,
    dto: UpdateReportCardCommentsDto,
    schoolId: string,
    userId: string,
  ): Promise<ReportCard> {
    const reportCard = await this.findOne(id, schoolId);

    if (dto.classTeacherComment !== undefined) {
      reportCard.classTeacherComment = dto.classTeacherComment;
      reportCard.classTeacherId = userId;
    }

    if (dto.principalComment !== undefined) {
      reportCard.principalComment = dto.principalComment;
      reportCard.principalId = userId;
    }

    if (dto.nextTermOpens) {
      reportCard.nextTermOpens = new Date(dto.nextTermOpens);
    }

    if (dto.nextTermCloses) {
      reportCard.nextTermCloses = new Date(dto.nextTermCloses);
    }

    return this.reportCardRepository.save(reportCard);
  }

  /**
   * Approve report card
   */
  async approve(id: string, schoolId: string, approvedBy: string): Promise<ReportCard> {
    const reportCard = await this.findOne(id, schoolId);
    
    reportCard.status = ReportCardStatus.APPROVED;
    reportCard.approvedBy = approvedBy;
    reportCard.approvedAt = new Date();

    return this.reportCardRepository.save(reportCard);
  }

  /**
   * Publish report card (make visible to parents)
   */
  async publish(id: string, schoolId: string): Promise<ReportCard> {
    const reportCard = await this.findOne(id, schoolId);

    if (reportCard.status !== ReportCardStatus.APPROVED) {
      throw new BadRequestException('Report card must be approved before publishing');
    }

    reportCard.status = ReportCardStatus.PUBLISHED;
    reportCard.publishedAt = new Date();

    return this.reportCardRepository.save(reportCard);
  }

  /**
   * Bulk publish report cards for a class
   */
  async bulkPublish(classId: string, termId: string, schoolId: string): Promise<{ published: number }> {
    const reportCards = await this.reportCardRepository.find({
      where: { classId, termId, schoolId, status: ReportCardStatus.APPROVED },
    });

    let published = 0;

    for (const rc of reportCards) {
      rc.status = ReportCardStatus.PUBLISHED;
      rc.publishedAt = new Date();
      await this.reportCardRepository.save(rc);
      published++;
    }

    return { published };
  }

  /**
   * Delete report card
   */
  async remove(id: string, schoolId: string): Promise<void> {
    const reportCard = await this.findOne(id, schoolId);
    await this.reportCardRepository.remove(reportCard);
  }

  // ==================== PDF GENERATION ====================

  /**
   * Generate PDF report card
   */
  async generatePdf(id: string, schoolId: string): Promise<Buffer> {
    const reportCard = await this.findOne(id, schoolId);
    const student = reportCard.student;

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    // Load fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Colors
    const headerColor = rgb(0.1, 0.3, 0.6);
    const textColor = rgb(0, 0, 0);
    const gradeColor = rgb(0.2, 0.5, 0.2);

    // === HEADER ===
    page.drawText('STUDENT REPORT CARD', {
      x: 180,
      y,
      size: 20,
      font: fontBold,
      color: headerColor,
    });
    y -= 30;

    // School name (placeholder - you'd get this from School entity)
    page.drawText('MWENDO SCHOOL SYSTEM', {
      x: 200,
      y,
      size: 14,
      font: fontBold,
      color: headerColor,
    });
    y -= 40;

    // === STUDENT INFO ===
    const studentName = this.formatStudentName(student);
    const infoLines = [
      `Student Name: ${studentName}`,
      `Admission No: ${student.admissionNumber}`,
      `Class: ${reportCard.class?.name || 'N/A'}`,
      `Term: ${(reportCard.term as any)?.name || 'N/A'}`,
      `Academic Year: ${(reportCard.academicYear as any)?.name || 'N/A'}`,
    ];

    for (const line of infoLines) {
      page.drawText(line, { x: 50, y, size: 11, font: fontRegular, color: textColor });
      y -= 18;
    }
    y -= 10;

    // === RESULTS TABLE HEADER ===
    page.drawText('SUBJECT', { x: 50, y, size: 10, font: fontBold, color: headerColor });
    page.drawText('MARKS', { x: 200, y, size: 10, font: fontBold, color: headerColor });
    page.drawText('%', { x: 260, y, size: 10, font: fontBold, color: headerColor });
    page.drawText('GRADE', { x: 310, y, size: 10, font: fontBold, color: headerColor });
    page.drawText('POINTS', { x: 370, y, size: 10, font: fontBold, color: headerColor });
    page.drawText('REMARKS', { x: 430, y, size: 10, font: fontBold, color: headerColor });
    y -= 5;

    // Draw line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: headerColor,
    });
    y -= 15;

    // === SUBJECT RESULTS ===
    for (const subject of reportCard.subjectResults) {
      // Calculate total marks from exams
      const totalObtained = subject.exams.reduce((sum, e) => sum + e.marksObtained, 0);
      const totalPossible = subject.exams.reduce((sum, e) => sum + e.totalMarks, 0);

      page.drawText(subject.subjectName.substring(0, 20), { x: 50, y, size: 9, font: fontRegular });
      page.drawText(`${totalObtained}/${totalPossible}`, { x: 200, y, size: 9, font: fontRegular });
      page.drawText(`${subject.averagePercentage.toFixed(1)}`, { x: 260, y, size: 9, font: fontRegular });
      page.drawText(subject.finalGrade, { x: 310, y, size: 9, font: fontBold, color: gradeColor });
      page.drawText(`${subject.gradePoints}`, { x: 370, y, size: 9, font: fontRegular });
      page.drawText(subject.teacherComment?.substring(0, 15) || '-', { x: 430, y, size: 8, font: fontRegular });
      y -= 16;
    }

    // Draw line after subjects
    y -= 5;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: headerColor,
    });
    y -= 20;

    // === SUMMARY (FIXED: Added checks for summary existence) ===
    const summary = reportCard.summary;
    page.drawText('SUMMARY', { x: 50, y, size: 12, font: fontBold, color: headerColor });
    y -= 20;

    if (summary) {
      const summaryLines = [
        `Total Subjects: ${summary.totalSubjects}`,
        `Overall Percentage: ${summary.overallPercentage?.toFixed(2) ?? 'N/A'}%`,
        `Overall Grade: ${summary.overallGrade ?? 'N/A'}`,
        `Total Points: ${summary.totalPoints ?? 'N/A'}`,
        `Mean Grade: ${summary.meanGrade || 'N/A'}`,
        `Class Position: ${summary.classRankSuffix ?? '-'} out of ${summary.classSize ?? '-'}`,
      ];

      for (const line of summaryLines) {
        page.drawText(line, { x: 50, y, size: 10, font: fontRegular });
        y -= 16;
      }
    } else {
        page.drawText('Summary calculation pending.', { x: 50, y, size: 10, font: fontRegular });
        y -= 16;
    }
    
    y -= 10;

    // === ATTENDANCE ===
    page.drawText('ATTENDANCE', { x: 50, y, size: 12, font: fontBold, color: headerColor });
    y -= 18;
    page.drawText(
      `Days Present: ${reportCard.daysPresent} | Days Absent: ${reportCard.daysAbsent} | Total: ${reportCard.totalSchoolDays}`,
      { x: 50, y, size: 10, font: fontRegular }
    );
    y -= 25;

    // === COMMENTS ===
    if (reportCard.classTeacherComment) {
      page.drawText("Class Teacher's Comment:", { x: 50, y, size: 10, font: fontBold });
      y -= 15;
      page.drawText(reportCard.classTeacherComment.substring(0, 80), { x: 50, y, size: 9, font: fontRegular });
      y -= 25;
    }

    if (reportCard.principalComment) {
      page.drawText("Principal's Comment:", { x: 50, y, size: 10, font: fontBold });
      y -= 15;
      page.drawText(reportCard.principalComment.substring(0, 80), { x: 50, y, size: 9, font: fontRegular });
      y -= 25;
    }

    // === NEXT TERM ===
    if (reportCard.nextTermOpens) {
      page.drawText(`Next Term Opens: ${reportCard.nextTermOpens.toDateString()}`, {
        x: 50, y, size: 9, font: fontRegular
      });
      y -= 15;
    }

    // === FEE BALANCE ===
    if (reportCard.feeBalance !== null && reportCard.feeBalance !== undefined) {
      page.drawText(`Fee Balance: KES ${reportCard.feeBalance.toLocaleString()}`, {
        x: 50, y, size: 10, font: fontBold, color: rgb(0.8, 0, 0)
      });
    }

    // === FOOTER ===
    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 50, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5)
    });
    page.drawText(`Report No: ${reportCard.reportNumber || 'N/A'}`, {
      x: 400, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5)
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Update report card with PDF info
    reportCard.pdfGeneratedAt = new Date();
    await this.reportCardRepository.save(reportCard);

    return Buffer.from(pdfBytes);
  }
}