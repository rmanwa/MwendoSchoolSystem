import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { School } from './school.entity';
import { Subject } from './subject.entity';
import { Class } from './class.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';
import { Teacher } from './teacher.entity';

export enum ExamType {
  // CBC Assessment Types
  FORMATIVE = 'formative',           // Continuous assessment
  SUMMATIVE = 'summative',           // End of term/year
  PROJECT = 'project',               // Project-based
  PRACTICAL = 'practical',           // Hands-on assessment
  PORTFOLIO = 'portfolio',           // Portfolio assessment
  
  // Traditional Types
  CAT = 'cat',                       // Continuous Assessment Test
  MIDTERM = 'midterm',               // Mid-term exam
  ENDTERM = 'endterm',               // End of term exam
  MOCK = 'mock',                     // Mock/Practice exam
  FINAL = 'final',                   // Final exam
  
  // Other Types
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  ORAL = 'oral',
  LAB = 'lab',
}

export enum ExamStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  GRADED = 'graded',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

@Entity('exams')
@Index(['schoolId', 'academicYearId', 'termId'])
@Index(['schoolId', 'classId', 'subjectId'])
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_exam_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column()
  name: string; // e.g., "Term 1 Mathematics CAT 1"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExamType,
    default: ExamType.CAT,
  })
  type: ExamType;

  @Column({
    type: 'enum',
    enum: ExamStatus,
    default: ExamStatus.DRAFT,
  })
  status: ExamStatus;

  // Subject being examined
  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // Class taking the exam
  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // Academic period
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

  // Teacher who created/administers the exam
  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  // Scoring
  @Column({ name: 'total_marks', type: 'decimal', precision: 6, scale: 2, default: 100 })
  totalMarks: number;

  @Column({ name: 'passing_marks', type: 'decimal', precision: 6, scale: 2, nullable: true })
  passingMarks: number;

  // Weight for grade calculation (e.g., CAT = 30%, Final = 70%)
  @Column({ name: 'weight_percentage', type: 'decimal', precision: 5, scale: 2, default: 100 })
  weightPercentage: number;

  // Scheduling
  @Column({ name: 'exam_date', type: 'date', nullable: true })
  examDate: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  // Location
  @Column({ nullable: true })
  venue: string;

  // Instructions for students
  @Column({ type: 'text', nullable: true })
  instructions: string;

  // Grading deadline
  @Column({ name: 'grading_deadline', type: 'date', nullable: true })
  gradingDeadline: Date;

  // Results published date
  @Column({ name: 'results_published_at', type: 'timestamp', nullable: true })
  resultsPublishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}