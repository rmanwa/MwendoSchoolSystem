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
import { Class } from './class.entity';
import { Subject } from './subject.entity';
import { Teacher } from './teacher.entity';

@Entity('class_subjects')
@Unique(['classId', 'subjectId']) // Prevent duplicate assignments
@Index(['schoolId', 'classId'])
@Index(['schoolId', 'subjectId'])
export class ClassSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant: School relationship
  @Index('idx_class_subject_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  // Class relationship
  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // Subject relationship
  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // Teacher assigned to teach this subject in this class
  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  // Override lessons per week for this specific class (optional)
  @Column({ name: 'lessons_per_week', type: 'int', nullable: true })
  lessonsPerWeek: number;

  // Schedule preferences (e.g., "morning", "afternoon", "any")
  @Column({ name: 'schedule_preference', nullable: true })
  schedulePreference: string;

  // Room assignment for this subject in this class
  @Column({ name: 'room_number', nullable: true })
  roomNumber: string;

  // Notes or special instructions
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}