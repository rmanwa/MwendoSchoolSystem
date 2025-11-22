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
import { User } from './user.entity';
import { AcademicYear } from './academic-year.entity';

@Entity('events')
export class Event {
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

  @Column({
    type: 'enum',
    enum: ['exam', 'sports', 'cultural', 'pta', 'holiday', 'trip', 'other'],
    default: 'other',
  })
  type: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'all_day', default: false })
  allDay: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_rule', nullable: true })
  recurrenceRule: string;

  @Column({ name: 'requires_rsvp', default: false })
  requiresRsvp: boolean;

  @Column({ name: 'rsvp_deadline', type: 'timestamp', nullable: true })
  rsvpDeadline: Date;

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants: number;

  @Column({ name: 'requires_permission', default: false })
  requiresPermission: boolean;

  @Column({ name: 'permission_form_url', nullable: true })
  permissionFormUrl: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ name: 'target_audience', type: 'json', nullable: true })
  targetAudience: string[];

  @Column({ name: 'created_by' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}