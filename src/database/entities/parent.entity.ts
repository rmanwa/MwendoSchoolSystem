import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';

import { School } from './school.entity';
import { User } from './user.entity';
import { Student } from './student.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_student_school')
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['father', 'mother', 'guardian', 'other'],
  })
  relationship: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ name: 'work_phone', nullable: true })
  workPhone: string;

  @Column({ name: 'work_address', nullable: true })
  workAddress: string;

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

  @Column({ name: 'is_primary_contact', default: false })
  isPrimaryContact: boolean;

  @Column({ name: 'can_pickup', default: true })
  canPickup: boolean;

  @Column({ name: 'receives_notifications', default: true })
  receivesNotifications: boolean;

  @Column({ name: 'receives_reports', default: true })
  receivesReports: boolean;

  @ManyToMany(() => Student)
  @JoinTable({
    name: 'student_parents',
    joinColumn: { name: 'parent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  students: Student[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}