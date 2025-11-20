import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Class } from './class.entity';
import { AcademicYear } from './academic-year.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'admission_number', unique: true })
  admissionNumber: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'other'],
  })
  gender: string;

  @Column({ name: 'blood_group', nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone: string;

  @Column({ name: 'emergency_contact_relationship', nullable: true })
  emergencyContactRelationship: string;

  @Column({ name: 'medical_conditions', type: 'text', nullable: true })
  medicalConditions: string;

  @Column({ nullable: true })
  allergies: string;

  @Column({ name: 'previous_school', nullable: true })
  previousSchool: string;

  @Column({ name: 'admission_date', type: 'date' })
  admissionDate: Date;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({
    type: 'enum',
    enum: ['active', 'graduated', 'transferred', 'suspended', 'expelled'],
    default: 'active',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}