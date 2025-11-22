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

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'created_by' })
  createdById: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'created_by' })
  createdBy: Teacher;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'is_free', default: false })
  isFree: boolean;

  @Column({ name: 'duration_hours', type: 'int', default: 0 })
  durationHours: number;

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  })
  level: string;

  @Column({ type: 'json', nullable: true })
  prerequisites: string[];

  @Column({ name: 'total_lessons', type: 'int', default: 0 })
  totalLessons: number;

  @Column({ name: 'total_quizzes', type: 'int', default: 0 })
  totalQuizzes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}