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
import { Quiz } from './quiz.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @ManyToOne(() => Quiz)
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'text' })
  question: string;

  @Column({
    type: 'enum',
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'],
    default: 'multiple-choice',
  })
  type: string;

  @Column({ type: 'json' })
  options: { text: string; isCorrect: boolean }[];

  @Column({ name: 'correct_answer', type: 'text', nullable: true })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}