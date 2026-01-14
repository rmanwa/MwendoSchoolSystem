import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { School } from './school.entity';
import { Student } from './student.entity';
import { AcademicYear } from './academic-year.entity';
import { Term } from './term.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// Invoice item structure (stored as JSON)
export interface InvoiceItem {
  feeStructureId?: string;
  name: string;
  category: string;
  amount: number;
  quantity: number;
  total: number;
}

@Entity('fee_invoices')
@Index(['schoolId', 'studentId'])
@Index(['schoolId', 'termId'])
@Index(['schoolId', 'status'])
@Index(['invoiceNumber'], { unique: true })
export class FeeInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'invoice_number', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'term_id', nullable: true })
  termId: string;

  @ManyToOne(() => Term, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'term_id' })
  term: Term;

  // Invoice items (JSON array)
  @Column({ type: 'jsonb', default: [] })
  items: InvoiceItem[];

  // Subtotal before discounts
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  // Discount amount
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  // Discount reason
  @Column({ name: 'discount_reason', type: 'text', nullable: true })
  discountReason: string;

  // Government subsidy (capitation)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'government_subsidy',
  })
  governmentSubsidy: number;

  // Bursary/Scholarship amount
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'bursary_amount',
  })
  bursaryAmount: number;

  // Late penalty
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'late_penalty',
  })
  latePenalty: number;

  // Total amount payable (subtotal - discount - subsidy - bursary + penalty)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_amount',
  })
  totalAmount: number;

  // Amount paid
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'amount_paid',
  })
  amountPaid: number;

  // Balance due
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  balance: number;

  // Currency
  @Column({ length: 3, default: 'KES' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  // Issue date
  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  // Due date
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  // Parent notified?
  @Column({ name: 'parent_notified', default: false })
  parentNotified: boolean;

  // Notification date
  @Column({ name: 'notification_date', type: 'timestamp', nullable: true })
  notificationDate: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}