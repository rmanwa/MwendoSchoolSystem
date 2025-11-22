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
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Multi-tenant: School relationship
  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId: string;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'time_limit', type: 'int', nullable: true })
  timeLimit: number;

  @Column({ name: 'passing_score', type: 'int', default: 60 })
  passingScore: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ name: 'shuffle_questions', default: false })
  shuffleQuestions: boolean;

  @Column({ name: 'show_correct_answers', default: true })
  showCorrectAnswers: boolean;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}