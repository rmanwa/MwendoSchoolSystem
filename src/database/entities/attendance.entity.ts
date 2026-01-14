import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { School } from './school.entity';
import { Student } from './student.entity';
import { Class } from './class.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  HALF_DAY = 'half_day',
}

@Entity('attendance')
@Unique(['studentId', 'classId', 'date']) // One record per student per class per day
@Index(['schoolId', 'date'])
@Index(['schoolId', 'classId', 'date'])
@Index(['studentId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_attendance_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'academic_year_id', type: 'uuid', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id', type: 'uuid', nullable: true })
  termId: string;

  @ManyToOne(() => Term, { nullable: true })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  // Time arrived (for late tracking)
  @Column({ name: 'arrival_time', type: 'time', nullable: true })
  arrivalTime: string;

  // Time left (for half-day tracking)
  @Column({ name: 'departure_time', type: 'time', nullable: true })
  departureTime: string;

  // Reason for absence or being excused
  @Column({ type: 'text', nullable: true })
  reason: string;

  // Who marked the attendance (teacher/admin user ID)
  @Column({ name: 'marked_by', type: 'uuid', nullable: true })
  markedBy: string;

  // Notes (e.g., "Sick note provided", "Called parent")
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}