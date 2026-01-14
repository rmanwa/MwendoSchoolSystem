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
import { Exam } from './exam.entity';
import { Student } from './student.entity';

@Entity('grades')
@Unique(['examId', 'studentId']) // One grade per student per exam
@Index(['schoolId', 'studentId'])
@Index(['schoolId', 'examId'])
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_grade_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'exam_id', type: 'uuid' })
  examId: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // Raw score obtained
  @Column({ name: 'marks_obtained', type: 'decimal', precision: 6, scale: 2 })
  marksObtained: number;

  // Percentage score (calculated)
  @Column({ name: 'percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  // Letter/Number grade (auto-calculated based on curriculum)
  @Column({ name: 'letter_grade', length: 10, nullable: true })
  letterGrade: string; // A, B+, EE, ME, 7, etc.

  // Grade points (for GPA calculation)
  @Column({ name: 'grade_points', type: 'decimal', precision: 4, scale: 2, nullable: true })
  gradePoints: number;

  // CBC Competency Level (1-7)
  @Column({ name: 'competency_level', type: 'int', nullable: true })
  competencyLevel: number;

  // CBC Rubric Assessment
  @Column({ name: 'cbc_level', length: 5, nullable: true })
  cbcLevel: string; // EE, ME, AE, BE

  // Rank in class (calculated)
  @Column({ name: 'class_rank', type: 'int', nullable: true })
  classRank: number;

  // Remarks/Comments
  @Column({ type: 'text', nullable: true })
  remarks: string;

  // Teacher's comment
  @Column({ name: 'teacher_comment', type: 'text', nullable: true })
  teacherComment: string;

  // Was student absent?
  @Column({ name: 'is_absent', default: false })
  isAbsent: boolean;

  // Special cases
  @Column({ name: 'is_exempted', default: false })
  isExempted: boolean;

  @Column({ name: 'exemption_reason', type: 'text', nullable: true })
  exemptionReason: string;

  // Who entered the grade
  @Column({ name: 'graded_by', type: 'uuid', nullable: true })
  gradedBy: string;

  @Column({ name: 'graded_at', type: 'timestamp', nullable: true })
  gradedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}