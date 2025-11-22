import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../common/constants/roles.constant';
import { School } from './school.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FIX 1: Explicitly set type: 'uuid'
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @ManyToOne(() => School, (school) => school.users)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Index()
  @Column({ unique: true })
  email: string;

  // FIX 2: Explicitly set type: 'varchar'
  @Index()
  @Column({ unique: true, nullable: true, type: 'varchar' })
  phone: string | null;

  @Column()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  // FIX 3: Explicitly set type: 'varchar'
  @Column({ name: 'middle_name', nullable: true, type: 'varchar' })
  middleName: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  // FIX 4: Explicitly set type: 'varchar'
  @Column({ nullable: true, type: 'varchar' })
  avatar: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  // FIX 5: Explicitly set type: 'varchar' for all tokens
  @Column({ name: 'email_verification_token', nullable: true, type: 'varchar' })
  emailVerificationToken: string | null;

  @Column({ name: 'phone_verification_code', nullable: true, type: 'varchar' })
  phoneVerificationCode: string | null;

  @Column({ name: 'password_reset_token', nullable: true, type: 'varchar' })
  passwordResetToken: string | null;

  // Timestamps usually work fine, but ensuring they are explicit doesn't hurt
  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ name: 'refresh_token', nullable: true, type: 'varchar' })
  refreshToken: string | null;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}