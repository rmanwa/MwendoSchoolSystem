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
import { AcademicYear } from './academic-year.entity';
import { Class } from './class.entity';

// Fee categories (Kenya vote heads)
export enum FeeCategory {
  TUITION = 'tuition',
  EXAMINATION = 'examination',
  BOOKS_STATIONERY = 'books_stationery',
  BOARDING = 'boarding',
  MEALS = 'meals',
  LUNCH = 'lunch',
  TRANSPORT = 'transport',
  ACTIVITY = 'activity',
  SPORTS = 'sports',
  CLUBS = 'clubs',
  DEVELOPMENT = 'development',
  MAINTENANCE = 'maintenance',
  INFRASTRUCTURE = 'infrastructure',
  ADMISSION = 'admission',
  REGISTRATION = 'registration',
  CAUTION = 'caution',
  UNIFORM = 'uniform',
  MEDICAL = 'medical',
  INSURANCE = 'insurance',
  ELECTRICITY = 'electricity',
  COMPUTER_LAB = 'computer_lab',
  LIBRARY = 'library',
  CAPITATION = 'capitation',
  GOK_SUBSIDY = 'gok_subsidy',
  OTHER = 'other',
}

export enum FeeFrequency {
  ONE_TIME = 'one_time',
  PER_TERM = 'per_term',
  PER_YEAR = 'per_year',
  PER_MONTH = 'per_month',
}

@Entity('fee_structures')
@Index(['schoolId', 'academicYearId'])
@Index(['schoolId', 'category'])
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FeeCategory,
    default: FeeCategory.TUITION,
  })
  category: FeeCategory;

  // Amount in KES
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: FeeFrequency,
    default: FeeFrequency.PER_TERM,
  })
  frequency: FeeFrequency;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  // Optional: specific class only
  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // Grade level range (null = all)
  @Column({ name: 'min_grade_level', nullable: true })
  minGradeLevel: number;

  @Column({ name: 'max_grade_level', nullable: true })
  maxGradeLevel: number;

  // Applies to boarders?
  @Column({ name: 'for_boarders', default: true })
  forBoarders: boolean;

  // Applies to day scholars?
  @Column({ name: 'for_day_scholars', default: true })
  forDayScholars: boolean;

  // Is mandatory?
  @Column({ name: 'is_mandatory', default: true })
  isMandatory: boolean;

  // Is government fee? (capitation, etc.)
  @Column({ name: 'is_government_fee', default: false })
  isGovernmentFee: boolean;

  // Due days from term start
  @Column({ name: 'due_days_from_term_start', default: 14 })
  dueDaysFromTermStart: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}