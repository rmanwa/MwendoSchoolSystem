import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';

import { School } from './school.entity';
import { Assignment } from './assignment.entity';
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';

@Entity('submissions')
@Unique(['assignmentId', 'studentId'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_submission_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @ManyToOne(() => Assignment)
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'attachments', type: 'json', nullable: true })
  attachments: string[];

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'is_late', default: false })
  isLate: boolean;

  @Column({
    type: 'enum',
    enum: ['pending', 'submitted', 'graded', 'returned', 'resubmit'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'marks_obtained', type: 'decimal', precision: 5, scale: 2, nullable: true })
  marksObtained: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'graded_by', nullable: true })
  gradedById: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'graded_by' })
  gradedBy: Teacher;

  @Column({ name: 'graded_at', type: 'timestamp', nullable: true })
  gradedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}