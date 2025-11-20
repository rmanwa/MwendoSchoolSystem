import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['core', 'elective', 'extra-curricular'],
    default: 'core',
  })
  type: string;

  @Column({ name: 'credit_hours', type: 'int', default: 1 })
  creditHours: number;

  @Column({ name: 'passing_marks', type: 'int', default: 40 })
  passingMarks: number;

  @Column({ name: 'total_marks', type: 'int', default: 100 })
  totalMarks: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}