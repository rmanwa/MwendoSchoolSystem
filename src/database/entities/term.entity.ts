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
import { AcademicYear } from './academic-year.entity';

@Entity('terms')
@Unique(['academicYearId', 'termNumber']) // No duplicate term numbers per year
@Index(['schoolId', 'academicYearId'])
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_term_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column()
  name: string; // e.g., "Term 1", "First Semester"

  @Column({ name: 'term_number', type: 'int' })
  termNumber: number; // 1, 2, 3

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'upcoming', 'break'],
    default: 'upcoming',
  })
  status: string;

  // Number of weeks in this term
  @Column({ name: 'weeks_count', type: 'int', nullable: true })
  weeksCount: number;

  // Optional: Mid-term break dates
  @Column({ name: 'midterm_break_start', type: 'date', nullable: true })
  midtermBreakStart: Date;

  @Column({ name: 'midterm_break_end', type: 'date', nullable: true })
  midtermBreakEnd: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}