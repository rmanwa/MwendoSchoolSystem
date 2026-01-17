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

/**
 * REPORT CARD ENTITY
 * ==================
 */

export enum ReportCardStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  exams: {
    examId: string;
    examName: string;
    examType: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    weight: number;
  }[];
  averagePercentage: number;
  finalGrade: string;
  gradePoints: number;
  teacherComment?: string;
  teacherId?: string;
  teacherName?: string;
  subjectRank?: number;
  subjectRankSuffix?: string;
}

export interface ReportCardSummary {
  totalSubjects: number;
  totalMarksObtained: number;
  totalMarksPossible: number;
  overallPercentage: number;
  overallGrade: string;
  totalPoints?: number;
  meanGrade?: string;
  meanPoints?: number;
  competencyLevel?: number;
  cbcLevel?: string;
  classRank: number;
  classRankSuffix: string;
  classSize: number;
  streamRank?: number;
  gradeRank?: number;
}

@Entity('report_cards')
@Unique(['studentId', 'termId'])
@Index(['schoolId', 'termId'])
@Index(['schoolId', 'classId', 'termId'])
@Index(['schoolId', 'status'])
export class ReportCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_report_card_school')
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

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id', type: 'uuid' })
  termId: string;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  // FIX: Added type: 'varchar' explicitly
  @Column({ name: 'report_number', type: 'varchar', length: 50, nullable: true })
  reportNumber: string | null;

  // FIX: Added type: 'varchar' explicitly
  @Column({ type: 'varchar', length: 50, default: '8-4-4' })
  curriculum: string;

  @Column({ name: 'subject_results', type: 'jsonb', default: [] })
  subjectResults: SubjectResult[];

  @Column({ type: 'jsonb', nullable: true })
  summary: ReportCardSummary | null;

  @Column({ name: 'days_present', type: 'int', default: 0 })
  daysPresent: number;

  @Column({ name: 'days_absent', type: 'int', default: 0 })
  daysAbsent: number;

  @Column({ name: 'total_school_days', type: 'int', default: 0 })
  totalSchoolDays: number;

  @Column({ name: 'class_teacher_comment', type: 'text', nullable: true })
  classTeacherComment: string | null;

  @Column({ name: 'class_teacher_id', type: 'uuid', nullable: true })
  classTeacherId: string | null;

  @Column({ name: 'principal_comment', type: 'text', nullable: true })
  principalComment: string | null;

  @Column({ name: 'principal_id', type: 'uuid', nullable: true })
  principalId: string | null;

  @Column({ name: 'parent_comment', type: 'text', nullable: true })
  parentComment: string | null;

  @Column({ name: 'parent_acknowledged_at', type: 'timestamp', nullable: true })
  parentAcknowledgedAt: Date | null;

  @Column({
    type: 'enum',
    enum: ReportCardStatus,
    default: ReportCardStatus.DRAFT,
  })
  status: ReportCardStatus;

  @Column({ name: 'next_term_opens', type: 'date', nullable: true })
  nextTermOpens: Date | null;

  @Column({ name: 'next_term_closes', type: 'date', nullable: true })
  nextTermCloses: Date | null;

  @Column({ name: 'fee_balance', type: 'decimal', precision: 12, scale: 2, nullable: true })
  feeBalance: number | null;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ name: 'pdf_generated_at', type: 'timestamp', nullable: true })
  pdfGeneratedAt: Date | null;

  @Column({ name: 'generated_by', type: 'uuid', nullable: true })
  generatedBy: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}