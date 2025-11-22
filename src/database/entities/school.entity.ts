import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column({ unique: true })
  code: string;

  @Column({ unique: true, nullable: true })
  domain: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  county: string;

  @Column({ nullable: true })
  country: string;

  @Column({
    type: 'enum',
    enum: ['pre-primary', 'primary', 'secondary', 'mixed'],
    default: 'mixed',
  })
  schoolType: string;

  @Column({
    type: 'enum',
    enum: ['trial', 'starter', 'pro', 'enterprise'],
    default: 'trial',
  })
  subscriptionTier: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'trial',
  })
  subscriptionStatus: string;

  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'subscription_starts_at', type: 'timestamp', nullable: true })
  subscriptionStartsAt: Date;

  @Column({ name: 'subscription_ends_at', type: 'timestamp', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ name: 'max_students', type: 'int', default: 300 })
  maxStudents: number;

  @Column({ name: 'max_teachers', type: 'int', default: 50 })
  maxTeachers: number;

  @Column({ name: 'max_storage_gb', type: 'int', default: 10 })
  maxStorageGB: number;

  @Column({ name: 'primary_color', default: '#2563EB' })
  primaryColor: string;

  @Column({ name: 'secondary_color', default: '#10B981' })
  secondaryColor: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'onboarding_completed', default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => User, (user) => user.school)
  users: User[];
}