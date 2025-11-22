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
import { Class } from './class.entity';
import { Subject } from './subject.entity';
import { Teacher } from './teacher.entity';
import { Term } from './term.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant: School relationship
  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ name: 'class_id' })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ name: 'term_id', nullable: true })
  termId: string;

  @ManyToOne(() => Term, { nullable: true })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @Column({ name: 'total_marks', type: 'int', default: 100 })
  totalMarks: number;

  @Column({
    type: 'enum',
    enum: ['assignment', 'homework', 'project', 'quiz', 'test'],
    default: 'assignment',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'attachments', type: 'json', nullable: true })
  attachments: string[];

  @Column({ name: 'allow_late_submission', default: false })
  allowLateSubmission: boolean;

  @Column({ name: 'late_submission_penalty', type: 'int', default: 0 })
  lateSubmissionPenalty: number;

  @Column({ name: 'max_file_size', type: 'int', default: 10485760 })
  maxFileSize: number;

  @Column({ name: 'allowed_file_types', type: 'json', nullable: true })
  allowedFileTypes: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}