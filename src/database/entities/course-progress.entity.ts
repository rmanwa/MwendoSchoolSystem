import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';

import { School } from './school.entity';
import { Course } from './course.entity';
import { Student } from './student.entity';

@Entity('course_progress')
@Unique(['courseId', 'studentId'])
export class CourseProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_course-progress_school')
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

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'completed_lessons', type: 'json', default: [] })
  completedLessons: string[];

  @Column({ name: 'completed_quizzes', type: 'json', default: [] })
  completedQuizzes: string[];

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ name: 'last_accessed_lesson', nullable: true })
  lastAccessedLessonId: string;

  @Column({ name: 'last_accessed_at', type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ name: 'total_time_spent', type: 'int', default: 0 })
  totalTimeSpent: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'certificate_issued', default: false })
  certificateIssued: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}