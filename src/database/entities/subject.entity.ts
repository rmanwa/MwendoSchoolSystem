import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { School } from './school.entity';
import { Teacher } from './teacher.entity';

export enum SubjectCategory {
  LANGUAGE = 'language',
  SCIENCE = 'science',
  MATHEMATICS = 'mathematics',
  HUMANITIES = 'humanities',
  ARTS = 'arts',
  TECHNICAL = 'technical',
  PHYSICAL_EDUCATION = 'physical_education',
  RELIGIOUS_EDUCATION = 'religious_education',
  LIFE_SKILLS = 'life_skills',
  BUSINESS = 'business',
}

export enum Curriculum {
  CBC = 'cbc', // Competency-Based Curriculum (Kenya)
  EIGHT_FOUR_FOUR = '8-4-4', // Old Kenyan System
  CAMBRIDGE = 'cambridge', // Cambridge IGCSE/A-Level
  IB = 'ib', // International Baccalaureate
  AMERICAN = 'american', // American Curriculum
  CUSTOM = 'custom', // School-specific subjects
}

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string; // e.g., "MATH101", "ENG201"

  @Column({
    type: 'enum',
    enum: SubjectCategory,
  })
  category: SubjectCategory;

  @Column({
    type: 'enum',
    enum: Curriculum,
  })
  curriculum: Curriculum;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'grade_level_start', type: 'int' })
  gradeLevelStart: number; // e.g., 1 (PP1)

  @Column({ name: 'grade_level_end', type: 'int' })
  gradeLevelEnd: number; // e.g., 13 (Form 4/Grade 12)

  @Column({ name: 'is_compulsory', default: false })
  isCompulsory: boolean; // Is this subject mandatory?

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'default_teacher_id', nullable: true })
  defaultTeacherId: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'default_teacher_id' })
  defaultTeacher: Teacher;

  @Column({ name: 'credits', type: 'decimal', precision: 4, scale: 2, nullable: true })
  credits: number; // For credit-based systems (IB, American)

  @Column({ name: 'lessons_per_week', type: 'int', nullable: true })
  lessonsPerWeek: number; // How many lessons per week

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional curriculum-specific data

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}