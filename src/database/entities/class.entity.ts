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

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant: School relationship
  @Index('idx_class_school')
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column()
  name: string;

  @Column({ nullable: true })
  section: string;

  @Column({ name: 'grade_level', type: 'int' })
  gradeLevel: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'room_number', nullable: true })
  roomNumber: string;

  @Column({ name: 'capacity', type: 'int', default: 30 })
  capacity: number;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'class_teacher_id', nullable: true })
  classTeacherId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}