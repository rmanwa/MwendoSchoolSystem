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
import { Student } from './student.entity';
import { Subject } from './subject.entity';
import { Class } from './class.entity';
import { Teacher } from './teacher.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';

@Entity('grades')
@Unique(['studentId', 'subjectId', 'termId', 'examType'])
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_student_school')
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

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'class_id' })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id' })
  termId: string;

  @ManyToOne(() => Term)
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({
    name: 'exam_type',
    type: 'enum',
    enum: ['cat', 'mid-term', 'final', 'assignment', 'project', 'practical'],
    default: 'final',
  })
  examType: string;

  @Column({ name: 'marks_obtained', type: 'decimal', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ name: 'total_marks', type: 'int', default: 100 })
  totalMarks: number;

  @Column({ name: 'percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ name: 'grade_letter', nullable: true })
  gradeLetter: string;

  @Column({ name: 'grade_points', type: 'decimal', precision: 3, scale: 2, nullable: true })
  gradePoints: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'entered_by' })
  enteredById: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'entered_by' })
  enteredBy: Teacher;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}