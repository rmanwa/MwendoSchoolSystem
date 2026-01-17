import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Attendance, AttendanceStatus } from '../../database/entities/attendance.entity';
import { Student } from '../../database/entities/student.entity';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkMarkAttendanceDto,
  QuickMarkAllPresentDto,
  AttendanceQueryDto,
} from './dto/attendance.dto';

/**
 * ATTENDANCE SERVICE - PRODUCTION READY
 * =====================================
 * 
 * Fixes applied:
 * 1. ✅ Fixed invalid order syntax (can't order by nested relation directly)
 * 2. ✅ Fixed student.user relation loading for name access
 * 3. ✅ Added proper relation loading throughout
 * 4. ✅ Added helper method for consistent student name formatting
 */

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // ==================== HELPER METHODS ====================

  /**
   * Format student name safely from student entity with user relation
   */
  private formatStudentName(student: Student | null | undefined): string {
    if (!student) return 'Unknown';
    // Student entity has eager: true on user relation, but let's be safe
    const user = (student as any).user;
    if (!user) return student.admissionNumber || 'Unknown';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
  }

  // ==================== SINGLE ATTENDANCE ====================

  /**
   * Mark attendance for a single student
   */
  async create(dto: CreateAttendanceDto, schoolId: string, markedBy: string): Promise<Attendance> {
    // Check for existing record
    const existing = await this.attendanceRepository.findOne({
      where: {
        studentId: dto.studentId,
        classId: dto.classId,
        date: new Date(dto.date),
        schoolId,
      },
    });

    if (existing) {
      throw new ConflictException('Attendance already marked for this student on this date');
    }

    const attendance = this.attendanceRepository.create({
      ...dto,
      date: new Date(dto.date),
      schoolId,
      markedBy,
    });

    return this.attendanceRepository.save(attendance);
  }

  /**
   * Update attendance record
   */
  async update(id: string, dto: UpdateAttendanceDto, schoolId: string): Promise<Attendance> {
    const attendance = await this.findOne(id, schoolId);
    Object.assign(attendance, dto);
    return this.attendanceRepository.save(attendance);
  }

  /**
   * Get single attendance record
   */
  async findOne(id: string, schoolId: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'class'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  /**
   * Delete attendance record
   */
  async remove(id: string, schoolId: string): Promise<void> {
    const attendance = await this.findOne(id, schoolId);
    await this.attendanceRepository.remove(attendance);
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Mark attendance for entire class at once
   */
  async bulkMark(dto: BulkMarkAttendanceDto, schoolId: string, markedBy: string): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const record of dto.records) {
      const existing = await this.attendanceRepository.findOne({
        where: {
          studentId: record.studentId,
          classId: dto.classId,
          date: new Date(dto.date),
          schoolId,
        },
      });

      if (existing) {
        // Update existing
        existing.status = record.status as AttendanceStatus;
        if (record.arrivalTime) existing.arrivalTime = record.arrivalTime;
        if (record.reason) existing.reason = record.reason;
        await this.attendanceRepository.save(existing);
        updated++;
      } else {
        // Create new
        const attendance = this.attendanceRepository.create({
          studentId: record.studentId,
          classId: dto.classId,
          date: new Date(dto.date),
          status: record.status as AttendanceStatus,
          arrivalTime: record.arrivalTime,
          reason: record.reason,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
          schoolId,
          markedBy,
        });
        await this.attendanceRepository.save(attendance);
        created++;
      }
    }

    return { created, updated };
  }

  /**
   * Quick mark all students as present
   */
  async quickMarkAllPresent(dto: QuickMarkAllPresentDto, schoolId: string, markedBy: string): Promise<{ marked: number }> {
    // Get all active students in the class
    const students = await this.studentRepository.find({
      where: { classId: dto.classId, schoolId, status: 'active' },
      select: ['id'],
    });

    if (students.length === 0) {
      throw new BadRequestException('No active students found in this class');
    }

    let marked = 0;

    for (const student of students) {
      // Check if already marked
      const existing = await this.attendanceRepository.findOne({
        where: {
          studentId: student.id,
          classId: dto.classId,
          date: new Date(dto.date),
          schoolId,
        },
      });

      if (!existing) {
        const attendance = this.attendanceRepository.create({
          studentId: student.id,
          classId: dto.classId,
          date: new Date(dto.date),
          status: AttendanceStatus.PRESENT,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
          schoolId,
          markedBy,
        });
        await this.attendanceRepository.save(attendance);
        marked++;
      }
    }

    return { marked };
  }

  // ==================== QUERIES & REPORTS ====================

  /**
   * Get attendance for a class on a specific date
   */
  async getClassAttendance(classId: string, date: string, schoolId: string): Promise<any> {
    // FIX #1: Load student.user relation and remove invalid order
    const records = await this.attendanceRepository.find({
      where: { classId, date: new Date(date), schoolId },
      relations: ['student', 'student.user'],
      order: { createdAt: 'ASC' }, // Order by creation time instead
    });

    // Get all students in class to show unmarked ones
    // FIX #2: Load user relation for student names
    const allStudents = await this.studentRepository.find({
      where: { classId, schoolId, status: 'active' },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const markedIds = records.map(r => r.studentId);
    const unmarked = allStudents.filter(s => !markedIds.includes(s.id));

    const summary = {
      total: allStudents.length,
      present: records.filter(r => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter(r => r.status === AttendanceStatus.LATE).length,
      excused: records.filter(r => r.status === AttendanceStatus.EXCUSED).length,
      halfDay: records.filter(r => r.status === AttendanceStatus.HALF_DAY).length,
      unmarked: unmarked.length,
    };

    // FIX #3: Format response with proper student names
    const formattedRecords = records.map(r => ({
      ...r,
      studentName: this.formatStudentName(r.student),
    }));

    const formattedUnmarked = unmarked.map(s => ({
      id: s.id,
      admissionNumber: s.admissionNumber,
      studentName: this.formatStudentName(s),
    }));

    return {
      date,
      classId,
      summary,
      records: formattedRecords,
      unmarkedStudents: formattedUnmarked,
    };
  }

  /**
   * Get student's attendance history
   */
  async getStudentAttendance(studentId: string, query: AttendanceQueryDto, schoolId: string): Promise<any> {
    const where: any = { studentId, schoolId };

    if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.status) where.status = query.status;

    const records = await this.attendanceRepository.find({
      where,
      relations: ['class'],
      order: { date: 'DESC' },
    });

    const total = records.length;
    const presentCount = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = records.filter(r => r.status === AttendanceStatus.LATE).length;
    
    const summary = {
      total,
      present: presentCount,
      absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      late: lateCount,
      excused: records.filter(r => r.status === AttendanceStatus.EXCUSED).length,
      halfDay: records.filter(r => r.status === AttendanceStatus.HALF_DAY).length,
      attendanceRate: total > 0 
        ? Math.round(((presentCount + lateCount) / total) * 100) 
        : 0,
    };

    return { studentId, summary, records };
  }

  /**
   * Get attendance with filters
   */
  async findAll(query: AttendanceQueryDto, schoolId: string): Promise<Attendance[]> {
    const where: any = { schoolId };

    if (query.classId) where.classId = query.classId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.attendanceRepository.find({
      where,
      relations: ['student', 'student.user', 'class'],
      order: { date: 'DESC', createdAt: 'DESC' },
      take: 500, // Limit for performance
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get attendance statistics for a class over a period
   */
  async getClassStatistics(classId: string, query: AttendanceQueryDto, schoolId: string): Promise<any> {
    const where: any = { classId, schoolId };

    if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;

    const records = await this.attendanceRepository.find({ where });

    const totalRecords = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter(r => r.status === AttendanceStatus.LATE).length;
    const excused = records.filter(r => r.status === AttendanceStatus.EXCUSED).length;

    // Get unique dates to count school days
    const uniqueDates = [...new Set(records.map(r => r.date.toString()))];

    // Get students with poor attendance (below 80%)
    const studentStats = new Map<string, { present: number; total: number }>();
    records.forEach(r => {
      if (!studentStats.has(r.studentId)) {
        studentStats.set(r.studentId, { present: 0, total: 0 });
      }
      const stat = studentStats.get(r.studentId)!;
      stat.total++;
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) {
        stat.present++;
      }
    });

    const poorAttendance: string[] = [];
    studentStats.forEach((stat, studentId) => {
      const rate = (stat.present / stat.total) * 100;
      if (rate < 80) poorAttendance.push(studentId);
    });

    return {
      classId,
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      statistics: {
        totalRecords,
        schoolDays: uniqueDates.length,
        present,
        absent,
        late,
        excused,
        overallAttendanceRate: totalRecords > 0 ? Math.round(((present + late) / totalRecords) * 100) : 0,
      },
      alerts: {
        studentsWithPoorAttendance: poorAttendance.length,
        poorAttendanceStudentIds: poorAttendance,
      },
    };
  }

  /**
   * Get school-wide attendance statistics
   */
  async getSchoolStatistics(query: AttendanceQueryDto, schoolId: string): Promise<any> {
    const where: any = { schoolId };

    if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;

    const records = await this.attendanceRepository.find({ where });

    const totalRecords = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter(r => r.status === AttendanceStatus.LATE).length;

    // Group by class
    const byClass = new Map<string, { present: number; total: number }>();
    records.forEach(r => {
      if (!byClass.has(r.classId)) {
        byClass.set(r.classId, { present: 0, total: 0 });
      }
      const stat = byClass.get(r.classId)!;
      stat.total++;
      if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) {
        stat.present++;
      }
    });

    const classRates: { classId: string; rate: number }[] = [];
    byClass.forEach((stat, classId) => {
      classRates.push({
        classId,
        rate: Math.round((stat.present / stat.total) * 100),
      });
    });

    // Sort by rate to find best/worst
    classRates.sort((a, b) => b.rate - a.rate);

    return {
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      statistics: {
        totalRecords,
        present,
        absent,
        late,
        overallAttendanceRate: totalRecords > 0 ? Math.round(((present + late) / totalRecords) * 100) : 0,
      },
      byClass: {
        totalClasses: classRates.length,
        bestAttendance: classRates.slice(0, 3),
        worstAttendance: classRates.slice(-3).reverse(),
      },
    };
  }

  /**
   * Get today's attendance summary
   */
  async getTodaySummary(schoolId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await this.attendanceRepository.find({
      where: { schoolId, date: today },
    });

    const totalStudents = await this.studentRepository.count({
      where: { schoolId, status: 'active' },
    });

    const markedStudents = new Set(records.map(r => r.studentId)).size;
    const presentCount = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = records.filter(r => r.status === AttendanceStatus.LATE).length;

    return {
      date: today.toISOString().split('T')[0],
      summary: {
        totalStudents,
        markedStudents,
        unmarkedStudents: totalStudents - markedStudents,
        present: presentCount,
        absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: lateCount,
        excused: records.filter(r => r.status === AttendanceStatus.EXCUSED).length,
      },
      attendanceRate: markedStudents > 0 
        ? Math.round(((presentCount + lateCount) / markedStudents) * 100)
        : 0,
    };
  }

  /**
   * Get absentees for a date (for SMS/notification)
   */
  async getAbsentees(date: string, schoolId: string, classId?: string): Promise<any[]> {
    const where: any = {
      schoolId,
      date: new Date(date),
      status: In([AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED]),
    };

    if (classId) where.classId = classId;

    // FIX #4: Load student.user relation for name access
    const records = await this.attendanceRepository.find({
      where,
      relations: ['student', 'student.user', 'class'],
    });

    return records.map(r => ({
      studentId: r.studentId,
      admissionNumber: r.student?.admissionNumber,
      studentName: this.formatStudentName(r.student),
      className: (r.class as any)?.name || 'Unknown',
      status: r.status,
      reason: r.reason,
    }));
  }
}