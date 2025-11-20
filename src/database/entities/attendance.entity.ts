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
import { Student } from './student.entity';
import { Class } from './class.entity';
import { Subject } from './subject.entity';
import { Teacher } from './teacher.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';

@Entity('attendance')
@Unique(['studentId', 'date', 'subjectId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'class_id' })
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Index()
  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['present', 'absent', 'late', 'excused', 'half-day'],
    default: 'present',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'marked_by' })
  markedById: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'marked_by' })
  markedBy: Teacher;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id', nullable: true })
  termId: string;

  @ManyToOne(() => Term, { nullable: true })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  @Column({ name: 'period_number', type: 'int', nullable: true })
  periodNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}