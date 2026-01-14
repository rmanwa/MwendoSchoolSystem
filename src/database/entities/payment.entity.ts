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
import { Student } from './student.entity';
import { FeeInvoice } from './fee-invoice.entity';

// Payment methods common in Kenya
export enum PaymentMethod {
  // Mobile Money (most popular)
  MPESA = 'mpesa',
  AIRTEL_MONEY = 'airtel_money',
  T_KASH = 't_kash',
  
  // Bank payments
  BANK_TRANSFER = 'bank_transfer',
  BANK_DEPOSIT = 'bank_deposit',
  CHEQUE = 'cheque',
  RTGS = 'rtgs',
  EFT = 'eft',
  
  // Other
  CASH = 'cash',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  
  // External funding
  BURSARY = 'bursary',
  SCHOLARSHIP = 'scholarship',
  GOVERNMENT = 'government',
  SPONSOR = 'sponsor',
  
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  REFUNDED = 'refunded',
}

// Vote head allocation (optional breakdown)
export interface VoteAllocation {
  category: string;
  name: string;
  amount: number;
}

@Entity('payments')
@Index(['schoolId', 'studentId', 'paymentDate'])
@Index(['schoolId', 'status'])
@Index(['receiptNumber'], { unique: true })
@Index(['mpesaReceiptNumber'])
@Index(['transactionReference'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id' })
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  // System-generated receipt number
  @Column({ name: 'receipt_number', length: 50, unique: true })
  receiptNumber: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // Optional link to invoice
  @Column({ name: 'invoice_id', nullable: true })
  invoiceId: string;

  @ManyToOne(() => FeeInvoice, (inv) => inv.payments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: FeeInvoice;

  // Amount in KES
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column({ length: 3, default: 'KES' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.MPESA,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  // Payment date
  @Column({ name: 'payment_date', type: 'timestamp' })
  paymentDate: Date;

  // External transaction reference
  @Column({ name: 'transaction_reference', length: 100, nullable: true })
  transactionReference: string;

  // === M-PESA FIELDS ===
  @Column({ name: 'mpesa_receipt_number', length: 50, nullable: true })
  mpesaReceiptNumber: string;

  @Column({ name: 'mpesa_phone_number', length: 20, nullable: true })
  mpesaPhoneNumber: string;

  @Column({ name: 'mpesa_transaction_time', type: 'timestamp', nullable: true })
  mpesaTransactionTime: Date;

  // === BANK FIELDS ===
  @Column({ name: 'bank_name', length: 100, nullable: true })
  bankName: string;

  @Column({ name: 'bank_branch', length: 100, nullable: true })
  bankBranch: string;

  @Column({ name: 'bank_account', length: 50, nullable: true })
  bankAccount: string;

  @Column({ name: 'cheque_number', length: 50, nullable: true })
  chequeNumber: string;

  @Column({ name: 'cheque_date', type: 'date', nullable: true })
  chequeDate: Date;

  // === PAYER INFO ===
  @Column({ name: 'payer_name', length: 200, nullable: true })
  payerName: string;

  @Column({ name: 'payer_phone', length: 20, nullable: true })
  payerPhone: string;

  @Column({ name: 'payer_email', length: 100, nullable: true })
  payerEmail: string;

  // === VOTE HEAD ALLOCATION ===
  // How the payment is allocated across fee categories
  @Column({ name: 'vote_allocation', type: 'jsonb', nullable: true })
  voteAllocation: VoteAllocation[];

  // Balance after this payment
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'balance_after',
  })
  balanceAfter: number;

  // Description/Notes
  @Column({ type: 'text', nullable: true })
  description: string;

  // === BURSARY/SCHOLARSHIP FIELDS ===
  @Column({ name: 'bursary_source', length: 100, nullable: true })
  bursarySource: string;

  @Column({ name: 'bursary_reference', length: 100, nullable: true })
  bursaryReference: string;

  // === REVERSAL FIELDS ===
  @Column({ name: 'reversed_by', nullable: true })
  reversedBy: string;

  @Column({ name: 'reversal_date', type: 'timestamp', nullable: true })
  reversalDate: Date;

  @Column({ name: 'reversal_reason', type: 'text', nullable: true })
  reversalReason: string;

  // Recorded by
  @Column({ name: 'recorded_by', nullable: true })
  recordedBy: string;

  // Verified by (for cash/cheque)
  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}