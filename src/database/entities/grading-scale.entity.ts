import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { School } from './school.entity';

@Entity('grading_scales')
export class GradingScale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column()
  name: string;

  @Column({ name: 'min_percentage', type: 'decimal', precision: 5, scale: 2 })
  minPercentage: number;

  @Column({ name: 'max_percentage', type: 'decimal', precision: 5, scale: 2 })
  maxPercentage: number;

  @Column({ name: 'grade_letter' })
  gradeLetter: string;

  @Column({ name: 'grade_points', type: 'decimal', precision: 3, scale: 2 })
  gradePoints: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}