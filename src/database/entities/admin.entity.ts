import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  designation: string;

  @Column({
    name: 'admin_level',
    type: 'enum',
    enum: ['super', 'senior', 'junior'],
    default: 'junior',
  })
  adminLevel: string;

  @Column({ name: 'can_manage_users', default: true })
  canManageUsers: boolean;

  @Column({ name: 'can_manage_classes', default: true })
  canManageClasses: boolean;

  @Column({ name: 'can_manage_finances', default: false })
  canManageFinances: boolean;

  @Column({ name: 'can_view_reports', default: true })
  canViewReports: boolean;

  @Column({ name: 'can_manage_settings', default: false })
  canManageSettings: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}