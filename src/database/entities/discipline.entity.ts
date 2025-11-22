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
import { Student } from './student.entity';
import { Teacher } from './teacher.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';

@Entity('discipline_records')
export class DisciplineRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_discipline_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({
    type: 'enum',
    enum: [
      'incident',
      'warning',
      'suspension',
      'expulsion',
      'reward',
      'achievement',
    ],
  })
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'incident_date', type: 'date' })
  incidentDate: Date;

  @Column({
    type: 'enum',
    enum: ['minor', 'moderate', 'major', 'critical'],
    nullable: true,
  })
  severity: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true })
  witnesses: string[];

  @Column({ name: 'action_taken', type: 'text', nullable: true })
  actionTaken: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'under-review', 'resolved', 'escalated', 'closed'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate: Date;

  @Column({ name: 'follow_up_notes', type: 'text', nullable: true })
  followUpNotes: string;

  @Column({ name: 'parent_notified', default: false })
  parentNotified: boolean;

  @Column({ name: 'parent_notified_date', type: 'timestamp', nullable: true })
  parentNotifiedDate: Date;

  @Column({ name: 'reported_by' })
  reportedById: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'reported_by' })
  reportedBy: Teacher;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: Teacher;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id', nullable: true })
  termId: string;

  @ManyToOne(() => Term, { nullable: true })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
