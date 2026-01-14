import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam, ExamStatus } from '../../database/entities/exam.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Student } from '../../database/entities/student.entity';
import { Subject } from '../../database/entities/subject.entity';
import {
  CreateExamDto,
  UpdateExamDto,
  ExamQueryDto,
} from './dto/exam.dto';
import {
  CreateGradeDto,
  UpdateGradeDto,
  BulkGradeEntryDto,
  GradeQueryDto,
  Curriculum,
} from './dto/grade.dto';

// ==================== GRADING SCALES (INLINE) ====================

interface GradeScale {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  points: number;
  description: string;
  gpa?: number;
  competencyLevel?: number;
}

interface CurriculumGradingSystem {
  curriculum: Curriculum;
  name: string;
  description: string;
  maxPoints: number;
  passingGrade: string;
  passingPercentage: number;
  scales: GradeScale[];
}

// Kenya CBC
const CBC_GRADING: CurriculumGradingSystem = {
  curriculum: Curriculum.CBC,
  name: 'Competency Based Curriculum',
  description: 'Kenya CBC assessment using competency levels',
  maxPoints: 7,
  passingGrade: 'AE',
  passingPercentage: 50,
  scales: [
    { grade: 'EE', minPercentage: 80, maxPercentage: 100, points: 7, description: 'Exceeds Expectations', competencyLevel: 7 },
    { grade: 'ME', minPercentage: 65, maxPercentage: 79.99, points: 5, description: 'Meets Expectations', competencyLevel: 5 },
    { grade: 'AE', minPercentage: 50, maxPercentage: 64.99, points: 3, description: 'Approaching Expectations', competencyLevel: 3 },
    { grade: 'BE', minPercentage: 0, maxPercentage: 49.99, points: 1, description: 'Below Expectations', competencyLevel: 1 },
  ],
};

// Kenya 8-4-4
const EIGHT_FOUR_FOUR_GRADING: CurriculumGradingSystem = {
  curriculum: Curriculum.EIGHT_FOUR_FOUR,
  name: 'Kenya 8-4-4 System (KCSE)',
  description: 'Traditional Kenyan grading with 12-point scale',
  maxPoints: 12,
  passingGrade: 'D',
  passingPercentage: 35,
  scales: [
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
};

// Cambridge IGCSE
const CAMBRIDGE_IGCSE_GRADING: CurriculumGradingSystem = {
  curriculum: Curriculum.CAMBRIDGE,
  name: 'Cambridge IGCSE',
  description: 'Cambridge International IGCSE A*-G grading',
  maxPoints: 9,
  passingGrade: 'G',
  passingPercentage: 20,
  scales: [
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

// IB
const IB_GRADING: CurriculumGradingSystem = {
  curriculum: Curriculum.IB,
  name: 'International Baccalaureate',
  description: 'IB Diploma Programme 1-7 scale',
  maxPoints: 7,
  passingGrade: '4',
  passingPercentage: 50,
  scales: [
    { grade: '7', minPercentage: 90, maxPercentage: 100, points: 7, description: 'Excellent' },
    { grade: '6', minPercentage: 80, maxPercentage: 89.99, points: 6, description: 'Very Good' },
    { grade: '5', minPercentage: 70, maxPercentage: 79.99, points: 5, description: 'Good' },
    { grade: '4', minPercentage: 50, maxPercentage: 69.99, points: 4, description: 'Satisfactory' },
    { grade: '3', minPercentage: 40, maxPercentage: 49.99, points: 3, description: 'Mediocre' },
    { grade: '2', minPercentage: 25, maxPercentage: 39.99, points: 2, description: 'Poor' },
    { grade: '1', minPercentage: 0, maxPercentage: 24.99, points: 1, description: 'Very Poor' },
  ],
};

// American GPA
const AMERICAN_GRADING: CurriculumGradingSystem = {
  curriculum: Curriculum.AMERICAN,
  name: 'American GPA System',
  description: 'US letter grades with 4.0 GPA scale',
  maxPoints: 4,
  passingGrade: 'D',
  passingPercentage: 60,
  scales: [
    { grade: 'A+', minPercentage: 97, maxPercentage: 100, points: 12, gpa: 4.0, description: 'Exceptional' },
    { grade: 'A', minPercentage: 93, maxPercentage: 96.99, points: 12, gpa: 4.0, description: 'Excellent' },
    { grade: 'A-', minPercentage: 90, maxPercentage: 92.99, points: 11, gpa: 3.7, description: 'Excellent' },
    { grade: 'B+', minPercentage: 87, maxPercentage: 89.99, points: 10, gpa: 3.3, description: 'Very Good' },
    { grade: 'B', minPercentage: 83, maxPercentage: 86.99, points: 9, gpa: 3.0, description: 'Good' },
    { grade: 'B-', minPercentage: 80, maxPercentage: 82.99, points: 8, gpa: 2.7, description: 'Good' },
    { grade: 'C+', minPercentage: 77, maxPercentage: 79.99, points: 7, gpa: 2.3, description: 'Average' },
    { grade: 'C', minPercentage: 73, maxPercentage: 76.99, points: 6, gpa: 2.0, description: 'Average' },
    { grade: 'C-', minPercentage: 70, maxPercentage: 72.99, points: 5, gpa: 1.7, description: 'Below Average' },
    { grade: 'D+', minPercentage: 67, maxPercentage: 69.99, points: 4, gpa: 1.3, description: 'Poor' },
    { grade: 'D', minPercentage: 60, maxPercentage: 66.99, points: 3, gpa: 1.0, description: 'Poor' },
    { grade: 'F', minPercentage: 0, maxPercentage: 59.99, points: 0, gpa: 0.0, description: 'Fail' },
  ],
};

// Helper functions
function getGradingSystem(curriculum: Curriculum): CurriculumGradingSystem {
  switch (curriculum) {
    case Curriculum.CBC:
      return CBC_GRADING;
    case Curriculum.EIGHT_FOUR_FOUR:
      return EIGHT_FOUR_FOUR_GRADING;
    case Curriculum.CAMBRIDGE:
      return CAMBRIDGE_IGCSE_GRADING;
    case Curriculum.IB:
      return IB_GRADING;
    case Curriculum.AMERICAN:
      return AMERICAN_GRADING;
    default:
      return EIGHT_FOUR_FOUR_GRADING;
  }
}

function calculateGrade(percentage: number, curriculum: Curriculum): GradeScale | null {
  const gradingSystem = getGradingSystem(curriculum);
  
  for (const scale of gradingSystem.scales) {
    if (percentage >= scale.minPercentage && percentage <= scale.maxPercentage) {
      return scale;
    }
  }
  
  return gradingSystem.scales[gradingSystem.scales.length - 1];
}

function calculateMeanGrade(subjectPoints: number[]): { meanPoints: number; meanGrade: string } {
  const sorted = [...subjectPoints].sort((a, b) => b - a);
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

// ==================== SERVICE ====================

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  // ==================== EXAM MANAGEMENT ====================

  async createExam(dto: CreateExamDto, schoolId: string): Promise<Exam> {
    const exam = this.examRepository.create({
      ...dto,
      schoolId,
      status: ExamStatus.DRAFT,
    });
    return this.examRepository.save(exam);
  }

  async findAllExams(query: ExamQueryDto, schoolId: string): Promise<Exam[]> {
    const where: any = { schoolId };

    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.teacherId) where.teacherId = query.teacherId;

    return this.examRepository.find({
      where,
      relations: ['subject', 'class', 'teacher'],
      order: { examDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneExam(id: string, schoolId: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id, schoolId },
      relations: ['subject', 'class', 'teacher', 'term', 'academicYear'],
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  async updateExam(id: string, dto: UpdateExamDto, schoolId: string): Promise<Exam> {
    const exam = await this.findOneExam(id, schoolId);
    Object.assign(exam, dto);
    return this.examRepository.save(exam);
  }

  async removeExam(id: string, schoolId: string): Promise<void> {
    const exam = await this.findOneExam(id, schoolId);
    await this.examRepository.remove(exam);
  }

  async publishResults(id: string, schoolId: string): Promise<Exam> {
    const exam = await this.findOneExam(id, schoolId);
    exam.status = ExamStatus.PUBLISHED;
    exam.resultsPublishedAt = new Date();
    return this.examRepository.save(exam);
  }

  // ==================== GRADE MANAGEMENT ====================

  async createGrade(dto: CreateGradeDto, schoolId: string, gradedBy: string, curriculum?: Curriculum): Promise<Grade> {
    const exam = await this.findOneExam(dto.examId, schoolId);

    const existing = await this.gradeRepository.findOne({
      where: { examId: dto.examId, studentId: dto.studentId, schoolId },
    });

    if (existing) {
      throw new ConflictException('Grade already exists for this student');
    }

    const percentage = (dto.marksObtained / Number(exam.totalMarks)) * 100;
    const gradeDetails = this.calculateGradeDetails(percentage, curriculum);

    const grade = this.gradeRepository.create({
      ...dto,
      schoolId,
      percentage,
      ...gradeDetails,
      gradedBy,
      gradedAt: new Date(),
    });

    const savedGrade = await this.gradeRepository.save(grade);
return Array.isArray(savedGrade) ? savedGrade[0] : savedGrade;
  }

  async bulkEnterGrades(dto: BulkGradeEntryDto, schoolId: string, gradedBy: string): Promise<{ created: number; updated: number }> {
    const exam = await this.findOneExam(dto.examId, schoolId);
    let created = 0;
    let updated = 0;

    for (const score of dto.scores) {
      const percentage = score.isAbsent ? 0 : (score.marksObtained / Number(exam.totalMarks)) * 100;
      const gradeDetails = this.calculateGradeDetails(percentage, dto.curriculum);

      const existing = await this.gradeRepository.findOne({
        where: { examId: dto.examId, studentId: score.studentId, schoolId },
      });

      if (existing) {
        existing.marksObtained = score.marksObtained;
        existing.percentage = percentage;
        existing.isAbsent = score.isAbsent || false;
        existing.remarks = score.remarks || existing.remarks;
        Object.assign(existing, gradeDetails);
        await this.gradeRepository.save(existing);
        updated++;
      } else {
        const grade = this.gradeRepository.create({
          examId: dto.examId,
          studentId: score.studentId,
          marksObtained: score.marksObtained,
          percentage,
          isAbsent: score.isAbsent || false,
          remarks: score.remarks,
          schoolId,
          gradedBy,
          gradedAt: new Date(),
          ...gradeDetails,
        });
        await this.gradeRepository.save(grade);
        created++;
      }
    }

    exam.status = ExamStatus.GRADED;
    await this.examRepository.save(exam);

    await this.calculateClassRankings(dto.examId, schoolId);

    return { created, updated };
  }

  async updateGrade(id: string, dto: UpdateGradeDto, schoolId: string, curriculum?: Curriculum): Promise<Grade> {
    const grade = await this.findOneGrade(id, schoolId);

    if (dto.marksObtained !== undefined) {
      const exam = await this.findOneExam(grade.examId, schoolId);
      grade.percentage = (dto.marksObtained / Number(exam.totalMarks)) * 100;
      const gradeDetails = this.calculateGradeDetails(grade.percentage, curriculum);
      Object.assign(grade, gradeDetails);
    }

    Object.assign(grade, dto);
    return this.gradeRepository.save(grade);
  }

  async findOneGrade(id: string, schoolId: string): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({
      where: { id, schoolId },
      relations: ['exam', 'student'],
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async findAllGrades(query: GradeQueryDto, schoolId: string): Promise<Grade[]> {
    const where: any = { schoolId };

    if (query.examId) where.examId = query.examId;
    if (query.studentId) where.studentId = query.studentId;

    return this.gradeRepository.find({
      where,
      relations: ['exam', 'student', 'exam.subject', 'exam.class'],
      order: { classRank: 'ASC' },
    });
  }

  async removeGrade(id: string, schoolId: string): Promise<void> {
    const grade = await this.findOneGrade(id, schoolId);
    await this.gradeRepository.remove(grade);
  }

  // ==================== RANKINGS & CALCULATIONS ====================

  async calculateClassRankings(examId: string, schoolId: string): Promise<void> {
    const grades = await this.gradeRepository.find({
      where: { examId, schoolId, isAbsent: false, isExempted: false },
      order: { percentage: 'DESC' },
    });

    let rank = 1;
    let prevPercentage = -1;
    let sameRankCount = 0;

    for (const grade of grades) {
      if (grade.percentage === prevPercentage) {
        sameRankCount++;
      } else {
        rank += sameRankCount;
        sameRankCount = 1;
      }
      grade.classRank = rank;
      prevPercentage = grade.percentage;
      await this.gradeRepository.save(grade);
    }
  }

  async getExamResults(examId: string, schoolId: string): Promise<any> {
    const exam = await this.findOneExam(examId, schoolId);
    const grades = await this.gradeRepository.find({
      where: { examId, schoolId },
      relations: ['student', 'student.user'],
      order: { classRank: 'ASC' },
    });

    const validGrades = grades.filter(g => !g.isAbsent && !g.isExempted);
    const percentages = validGrades.map(g => Number(g.percentage));

    const statistics = {
      totalStudents: grades.length,
      graded: validGrades.length,
      absent: grades.filter(g => g.isAbsent).length,
      exempted: grades.filter(g => g.isExempted).length,
      passed: validGrades.filter(g => Number(g.percentage) >= (Number(exam.passingMarks) || 40)).length,
      failed: validGrades.filter(g => Number(g.percentage) < (Number(exam.passingMarks) || 40)).length,
      highest: percentages.length > 0 ? Math.max(...percentages) : 0,
      lowest: percentages.length > 0 ? Math.min(...percentages) : 0,
      average: percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0,
      passRate: validGrades.length > 0 
        ? (validGrades.filter(g => Number(g.percentage) >= (Number(exam.passingMarks) || 40)).length / validGrades.length) * 100 
        : 0,
    };

    const distribution: { [grade: string]: number } = {};
    validGrades.forEach(g => {
      distribution[g.letterGrade] = (distribution[g.letterGrade] || 0) + 1;
    });

    return {
      exam,
      statistics: {
        ...statistics,
        average: Math.round(statistics.average * 100) / 100,
        passRate: Math.round(statistics.passRate * 100) / 100,
      },
      distribution,
      grades,
    };
  }

  // ==================== REPORT CARDS ====================

  async generateReportCard(studentId: string, termId: string, schoolId: string, curriculum?: Curriculum): Promise<any> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, schoolId },
      relations: ['class', 'user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const grades = await this.gradeRepository.find({
      where: { studentId, schoolId },
      relations: ['exam', 'exam.subject', 'exam.term'],
    });

    const termGrades = grades.filter(g => g.exam?.termId === termId);

    const subjectGrades: { [subjectId: string]: { subject: any; grades: Grade[]; average: number; finalGrade: string } } = {};

    for (const grade of termGrades) {
      const subjectId = grade.exam.subjectId;
      if (!subjectGrades[subjectId]) {
        subjectGrades[subjectId] = {
          subject: grade.exam.subject,
          grades: [],
          average: 0,
          finalGrade: '',
        };
      }
      subjectGrades[subjectId].grades.push(grade);
    }

    const subjectResults: any[] = [];
    let totalPercentage = 0;
    let subjectCount = 0;

    for (const subjectId of Object.keys(subjectGrades)) {
      const sg = subjectGrades[subjectId];
      const validGrades = sg.grades.filter(g => !g.isAbsent && !g.isExempted);
      
      if (validGrades.length > 0) {
        let totalWeight = 0;
        let weightedSum = 0;

        for (const g of validGrades) {
          const weight = Number(g.exam.weightPercentage) || 100;
          weightedSum += Number(g.percentage) * weight;
          totalWeight += weight;
        }

        const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const gradeDetails = this.calculateGradeDetails(average, curriculum);

        subjectResults.push({
          subject: sg.subject,
          grades: validGrades.map(g => ({
            exam: g.exam.name,
            type: g.exam.type,
            marks: g.marksObtained,
            total: g.exam.totalMarks,
            percentage: g.percentage,
            grade: g.letterGrade,
          })),
          average: Math.round(average * 100) / 100,
          finalGrade: gradeDetails.letterGrade,
          gradePoints: gradeDetails.gradePoints,
        });

        totalPercentage += average;
        subjectCount++;
      }
    }

    const overallAverage = subjectCount > 0 ? totalPercentage / subjectCount : 0;
    const overallGrade = this.calculateGradeDetails(overallAverage, curriculum);

    let curriculumMetrics: any = {};
    if (curriculum === Curriculum.EIGHT_FOUR_FOUR) {
      const points = subjectResults.map(s => s.gradePoints);
      const meanGrade = calculateMeanGrade(points);
      curriculumMetrics = {
        meanPoints: meanGrade.meanPoints,
        meanGrade: meanGrade.meanGrade,
        totalPoints: points.reduce((a, b) => a + b, 0),
      };
    }

    // Get student name from user relation or admission number
    const studentName = (student as any).user 
      ? `${(student as any).user.firstName} ${(student as any).user.lastName}`
      : student.admissionNumber;

    return {
      student: {
        id: student.id,
        name: studentName,
        admissionNumber: student.admissionNumber,
        class: student.class?.name,
      },
      termId,
      subjects: subjectResults,
      summary: {
        totalSubjects: subjectCount,
        overallAverage: Math.round(overallAverage * 100) / 100,
        overallGrade: overallGrade.letterGrade,
        ...curriculumMetrics,
      },
      generatedAt: new Date(),
    };
  }

  // ==================== CLASS PERFORMANCE ====================

  async getClassRanking(classId: string, termId: string, schoolId: string): Promise<any> {
    const students = await this.studentRepository.find({
      where: { classId, schoolId },
      relations: ['user'],
    });

    const rankings: any[] = [];

    for (const student of students) {
      const grades = await this.gradeRepository.find({
        where: { studentId: student.id, schoolId },
        relations: ['exam'],
      });

      const termGrades = grades.filter(g => g.exam?.termId === termId && !g.isAbsent && !g.isExempted);
      
      if (termGrades.length > 0) {
        const totalPercentage = termGrades.reduce((sum, g) => sum + Number(g.percentage), 0);
        const average = totalPercentage / termGrades.length;

        // Get student name from user relation or admission number
        const studentName = (student as any).user 
          ? `${(student as any).user.firstName} ${(student as any).user.lastName}`
          : student.admissionNumber;

        rankings.push({
          studentId: student.id,
          studentName,
          admissionNumber: student.admissionNumber,
          average: Math.round(average * 100) / 100,
          examsCount: termGrades.length,
        });
      }
    }

    rankings.sort((a, b) => b.average - a.average);

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

    return {
      classId,
      termId,
      totalStudents: students.length,
      rankedStudents: rankings.length,
      rankings,
    };
  }

  async getSubjectPerformance(subjectId: string, classId: string, termId: string, schoolId: string): Promise<any> {
    const grades = await this.gradeRepository.find({
      where: { schoolId },
      relations: ['exam', 'student'],
    });

    const filteredGrades = grades.filter(g => 
      g.exam?.subjectId === subjectId &&
      g.exam?.classId === classId &&
      g.exam?.termId === termId &&
      !g.isAbsent &&
      !g.isExempted
    );

    const percentages = filteredGrades.map(g => Number(g.percentage));
    const gradeDistribution: { [grade: string]: number } = {};
    
    filteredGrades.forEach(g => {
      gradeDistribution[g.letterGrade] = (gradeDistribution[g.letterGrade] || 0) + 1;
    });

    return {
      subjectId,
      classId,
      termId,
      statistics: {
        totalStudents: filteredGrades.length,
        highest: percentages.length > 0 ? Math.max(...percentages) : 0,
        lowest: percentages.length > 0 ? Math.min(...percentages) : 0,
        average: percentages.length > 0 
          ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100 
          : 0,
        passRate: percentages.length > 0
          ? Math.round((percentages.filter(p => p >= 50).length / percentages.length) * 100 * 100) / 100
          : 0,
      },
      gradeDistribution,
    };
  }

  // ==================== HELPER METHODS ====================

  private calculateGradeDetails(percentage: number, curriculum?: Curriculum): any {
    const curr = curriculum || Curriculum.EIGHT_FOUR_FOUR;
    const gradeInfo = calculateGrade(percentage, curr);

    if (!gradeInfo) {
      return {
        letterGrade: 'U',
        gradePoints: 0,
        competencyLevel: null,
        cbcLevel: null,
      };
    }

    return {
      letterGrade: gradeInfo.grade,
      gradePoints: gradeInfo.gpa || gradeInfo.points,
      competencyLevel: gradeInfo.competencyLevel || null,
      cbcLevel: curr === Curriculum.CBC ? gradeInfo.grade : null,
    };
  }

  getGradingScales(curriculum?: Curriculum): any {
    if (curriculum) {
      return getGradingSystem(curriculum);
    }
    return {
      cbc: CBC_GRADING,
      '8-4-4': EIGHT_FOUR_FOUR_GRADING,
      cambridge: CAMBRIDGE_IGCSE_GRADING,
      ib: IB_GRADING,
      american: AMERICAN_GRADING,
    };
  }
}