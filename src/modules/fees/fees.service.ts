/**
 * FEES SERVICE — PRODUCTION READY (v4.1 FULL)
 * ==========================================
 * Includes ALL methods used by your controller:
 * - Templates/Reference data
 * - Fee structures
 * - Invoices + bulk invoices
 * - Payments + reversals (transactional, row-locked)
 * - Reports: statements, class summary, payment method breakdown, defaulters, daily report, termly summary
 *
 * Money safety:
 * - Strict money parsing for inputs
 * - Rounding helper
 * - TRUE idempotency: DB unique constraints + catch 23505 + return existing payment
 * - CRITICAL FIX: if duplicate payment is returned, invoice is NOT updated again
 *
 * IMPORTANT:
 * This expects DB UNIQUE constraints (Postgres recommended):
 * - payments: (school_id, mpesa_receipt_number) WHERE mpesa_receipt_number IS NOT NULL
 * - payments: (school_id, transaction_reference) WHERE transaction_reference IS NOT NULL
 * - payments: (school_id, cheque_number) WHERE cheque_number IS NOT NULL
 * - payments: (school_id, receipt_number) UNIQUE
 * - invoices: (school_id, invoice_number) UNIQUE
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Not,
  In,
  Between,
  DataSource,
  EntityManager,
} from 'typeorm';

import { FeeStructure } from '../../database/entities/fee-structure.entity';
import { FeeInvoice } from '../../database/entities/fee-invoice.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Student } from '../../database/entities/student.entity';
import { Class } from '../../database/entities/class.entity';
import { Term } from '../../database/entities/term.entity';
import { AcademicYear } from '../../database/entities/academic-year.entity';

import {
  FeeCategory,
  FeeFrequency,
  InvoiceStatus,
  PaymentStatus,
  BursarySource,
  getEnumValues,
} from './fees.enums';

// ============================================
// MONEY HELPERS (strict + rounding)
// ============================================

const parseMoneyStrict = (n: any, fieldName = 'amount'): number => {
  const num = Number(n);
  if (!Number.isFinite(num)) {
    throw new BadRequestException(`Invalid ${fieldName}: must be a valid number`);
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const moneyRound = (n: number): number => {
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

// Safe parse for reporting math / stored numeric fields that might be strings
const moneyOrZero = (n: any): number => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// ============================================
// TYPES
// ============================================

export interface VoteHead {
  category: string;
  name: string;
  amount: number;
  isGovt: boolean;
  optional?: boolean;
}

export interface FeeTemplate {
  name: string;
  category: string;
  type: string;
  totalAnnual: number;
  gokSubsidy: number;
  parentPays: number;
  voteHeads: VoteHead[];
}

export interface BulkError {
  studentId: string;
  name: string;
  error: string;
}

export interface BulkGenerationResult {
  total: number;
  created: number;
  skipped: number;
  errors: BulkError[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type SavePaymentResult = { payment: Payment; created: boolean };

// ============================================
// CONSTANTS (you can expand these)
// ============================================

export const GOK_CAPITATION = {
  secondary: {
    total: 22244,
    breakdown: {
      tuition: 5446,
      books: 3814,
      examination: 3091,
      activity: 1815,
      maintenance: 4001,
      qualityAssurance: 1077,
      smasse: 600,
      ict: 2400,
    },
  },
};

export const CAPITATION_DISBURSEMENT = { term1: 0.5, term2: 0.3, term3: 0.2 };

export const PUBLIC_SCHOOL_FEE_TEMPLATES = {
  national_boarding: {
    name: 'National School (Boarding)',
    category: 'national',
    type: 'boarding',
    totalAnnual: 75798,
    gokSubsidy: 22244,
    parentPays: 53554,
  },
  day_school: {
    name: 'Day School (Free Day Secondary)',
    category: 'sub_county',
    type: 'day',
    totalAnnual: 22244,
    gokSubsidy: 22244,
    parentPays: 0,
  },
};

export const KENYA_BANKS = [
  { name: 'Kenya Commercial Bank (KCB)', paybill: '522522', code: 'KCB' },
  { name: 'Equity Bank', paybill: '247247', code: 'EQUITY' },
  { name: 'Co-operative Bank', paybill: '400200', code: 'COOP' },
  { name: 'National Bank of Kenya', paybill: '625625', code: 'NBK' },
  { name: 'NCBA Bank', paybill: '880100', code: 'NCBA' },
];

export const PRIVATE_SCHOOL_FEE_RANGES = {
  budget: { min: 30000, max: 80000, description: 'Budget private schools' },
  midRange: { min: 80000, max: 200000, description: 'Mid-range private schools' },
  premium: { min: 200000, max: 500000, description: 'Premium private schools' },
  international: { min: 500000, max: 2000000, description: 'International schools' },
};

export const DISCOUNT_TYPES = [
  { code: 'sibling_2', name: 'Sibling Discount (2nd child)', percentage: 10 },
  { code: 'sibling_3', name: 'Sibling Discount (3rd child)', percentage: 15 },
  { code: 'staff_child', name: 'Staff Child Discount', percentage: 25 },
  { code: 'early_payment', name: 'Early Payment Discount', percentage: 5 },
  { code: 'full_year', name: 'Full Year Payment Discount', percentage: 10 },
];

export const BURSARY_TYPES = [
  { code: BursarySource.NG_CDF, name: 'NG-CDF', description: 'Constituency Development Fund' },
  { code: BursarySource.COUNTY, name: 'County Bursary', description: 'County-level bursaries' },
  { code: BursarySource.PRESIDENTIAL, name: 'PSSB', description: 'Presidential Secondary School Bursary' },
  { code: BursarySource.HELB, name: 'HELB', description: 'Higher Education Loans Board' },
  { code: BursarySource.NGO, name: 'NGO', description: 'NGO bursary' },
  { code: BursarySource.PRIVATE, name: 'Private Sponsor', description: 'Private sponsor' },
];

// ============================================
// SERVICE
// ============================================

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(FeeInvoice)
    private invoiceRepository: Repository<FeeInvoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Term)
    private termRepository: Repository<Term>,
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
    private dataSource: DataSource,
  ) {}

  // Minimal templates (you can expand using your earlier full template set)
  private readonly publicSchoolTemplates: Record<string, FeeTemplate> = {
    national_boarding: {
      name: 'National School (Boarding)',
      category: 'national',
      type: 'boarding',
      totalAnnual: 75798,
      gokSubsidy: 22244,
      parentPays: 53554,
      voteHeads: [
        { category: FeeCategory.TUITION, name: 'Tuition (GOK)', amount: 5446, isGovt: true },
        { category: FeeCategory.BOOKS_STATIONERY, name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
        { category: FeeCategory.EXAMINATION, name: 'Examination (GOK)', amount: 3091, isGovt: true },
        { category: FeeCategory.BOARDING, name: 'Boarding Fee', amount: 40535, isGovt: false },
        { category: FeeCategory.MEDICAL, name: 'Medical & Insurance', amount: 2000, isGovt: false },
      ],
    },
    day_school: {
      name: 'Day School (Free Day Secondary)',
      category: 'sub_county',
      type: 'day',
      totalAnnual: 22244,
      gokSubsidy: 22244,
      parentPays: 0,
      voteHeads: [
        { category: FeeCategory.TUITION, name: 'Tuition (GOK)', amount: 5446, isGovt: true },
        { category: FeeCategory.BOOKS_STATIONERY, name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
        { category: FeeCategory.EXAMINATION, name: 'Examination (GOK)', amount: 3091, isGovt: true },
      ],
    },
  };

  // ============================================
  // REFERENCE DATA
  // ============================================

  getPublicSchoolFeeTemplates() {
    return {
      templates: this.publicSchoolTemplates,
      capitation: GOK_CAPITATION,
      disbursementRatio: CAPITATION_DISBURSEMENT,
    };
  }

  getPrivateSchoolFeeRanges() {
    return { ranges: PRIVATE_SCHOOL_FEE_RANGES };
  }

  getKenyaBanks() {
    return KENYA_BANKS;
  }

  getFeeCategories() {
    return getEnumValues(FeeCategory).map((cat) => ({
      value: cat,
      label: cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }

  getBursaryTypes() {
    return BURSARY_TYPES;
  }

  getDiscountTypes() {
    return DISCOUNT_TYPES;
  }

  // ============================================
  // FEE STRUCTURES
  // ============================================

  async createFeeStructure(schoolId: string, dto: any, createdBy: string): Promise<FeeStructure> {
    const amount = parseMoneyStrict(dto.amount, 'fee amount');
    if (amount <= 0) throw new BadRequestException('Fee amount must be greater than 0');

    const feeStructure = this.feeStructureRepository.create({
      ...dto,
      amount,
      schoolId,
      createdBy,
    } as Partial<FeeStructure>);

    return this.feeStructureRepository.save(feeStructure);
  }

  async createFromTemplate(
    schoolId: string,
    templateKey: string,
    academicYearId: string,
    createdBy: string,
  ): Promise<FeeStructure[]> {
    const template = this.publicSchoolTemplates[templateKey];
    if (!template) throw new NotFoundException(`Template '${templateKey}' not found`);

    const isBoardingTemplate = template.type === 'boarding';
    const isDayTemplate = template.type === 'day';

    const feeStructures = template.voteHeads.map((vh) =>
      this.feeStructureRepository.create({
        schoolId,
        name: vh.name,
        category: vh.category as FeeCategory,
        amount: moneyRound(vh.amount),
        frequency: FeeFrequency.PER_YEAR, // annual amounts
        academicYearId,
        isGovernmentFee: vh.isGovt,
        isMandatory: true,
        forBoarders: isBoardingTemplate || vh.isGovt,
        forDayScholars: isDayTemplate || vh.isGovt,
        isActive: true,
        createdBy,
      } as Partial<FeeStructure>),
    );

    return this.feeStructureRepository.save(feeStructures);
  }

  async findAllFeeStructures(schoolId: string, query: any) {
    const where: any = { schoolId };
    if (query.category) where.category = query.category;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.classId) where.classId = query.classId;
    if (query.forBoarders !== undefined) where.forBoarders = query.forBoarders;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const feeStructures = await this.feeStructureRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });

    const govtTotal = feeStructures
      .filter((f) => !!(f as any).isGovernmentFee)
      .reduce((sum, f) => moneyRound(sum + moneyOrZero((f as any).amount)), 0);

    const parentTotal = feeStructures
      .filter((f) => !(f as any).isGovernmentFee)
      .reduce((sum, f) => moneyRound(sum + moneyOrZero((f as any).amount)), 0);

    return {
      feeStructures,
      summary: {
        totalItems: feeStructures.length,
        governmentSubsidy: govtTotal,
        parentPayable: parentTotal,
        grandTotal: moneyRound(govtTotal + parentTotal),
        currency: 'KES',
      },
    };
  }

  async updateFeeStructure(schoolId: string, id: string, dto: any): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({ where: { id, schoolId } });
    if (!feeStructure) throw new NotFoundException('Fee structure not found');

    if (dto.amount !== undefined) {
      dto.amount = parseMoneyStrict(dto.amount, 'fee amount');
      if (dto.amount <= 0) throw new BadRequestException('Fee amount must be greater than 0');
    }

    Object.assign(feeStructure, dto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async removeFeeStructure(schoolId: string, id: string) {
    const result = await this.feeStructureRepository.delete({ id, schoolId });
    if (result.affected === 0) throw new NotFoundException('Fee structure not found');
    return { deleted: true };
  }

  // ============================================
  // INVOICES
  // ============================================

  async createInvoice(schoolId: string, dto: any, createdBy: string): Promise<FeeInvoice> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, schoolId },
      relations: ['class', 'user'],
    });
    if (!student) throw new NotFoundException('Student not found');

    if (dto.termId) {
      const existing = await this.invoiceRepository.findOne({
        where: {
          schoolId,
          studentId: dto.studentId,
          termId: dto.termId,
          status: Not(In([InvoiceStatus.CANCELLED])),
        },
      });
      if (existing) throw new ConflictException('Invoice already exists for this student and term');
    }

    const feeStructures = await this.feeStructureRepository.find({
      where: { schoolId, isActive: true, academicYearId: dto.academicYearId },
    });

    const applicableFees = feeStructures.filter((fee) => {
      if ((fee as any).forBoarders && (fee as any).forDayScholars) return true;
      if ((student as any).isBoarder && (fee as any).forBoarders) return true;
      if (!(student as any).isBoarder && (fee as any).forDayScholars) return true;
      return false;
    });

    let items = dto.items ?? [];
    if (items.length === 0) {
      items = applicableFees.map((fee) => ({
        feeStructureId: (fee as any).id,
        name: (fee as any).name,
        category: (fee as any).category,
        amount: moneyOrZero((fee as any).amount),
        quantity: 1,
        total: moneyOrZero((fee as any).amount),
        isGovernmentFee: !!(fee as any).isGovernmentFee,
      }));
    }

    let subtotal = 0;
    let governmentSubsidy = 0;

    for (const item of items) {
      const qty = item.quantity ?? 1;
      const itemTotal = item.total != null ? moneyOrZero(item.total) : moneyOrZero(item.amount) * qty;
      subtotal = moneyRound(subtotal + itemTotal);
      if (item.isGovernmentFee) governmentSubsidy = moneyRound(governmentSubsidy + itemTotal);
    }

    const discountAmount = moneyOrZero(dto.discountAmount);
    const bursaryAmount = moneyOrZero(dto.bursaryAmount);
    const totalAmount = moneyRound(subtotal - governmentSubsidy - discountAmount - bursaryAmount);

    if (totalAmount < 0) {
      throw new BadRequestException('Total amount cannot be negative. Check discount/bursary.');
    }

    const invoice = this.invoiceRepository.create({
      schoolId,
      invoiceNumber: await this.generateUniqueInvoiceNumber(schoolId),
      studentId: dto.studentId,
      academicYearId: dto.academicYearId,
      termId: dto.termId,
      items,
      subtotal,
      governmentSubsidy,
      discountAmount,
      discountReason: dto.discountReason,
      bursaryAmount,
      totalAmount,
      amountPaid: 0,
      balance: totalAmount,
      status: InvoiceStatus.DRAFT,
      issueDate: dto.issueDate ?? new Date(),
      dueDate: dto.dueDate ?? this.calculateDueDate(14),
      notes: dto.notes,
      createdBy,
    } as Partial<FeeInvoice>);

    // retry on unique constraint (invoice_number)
    return this.saveWithRetry(
      () => this.invoiceRepository.save(invoice),
      async () => { (invoice as any).invoiceNumber = await this.generateUniqueInvoiceNumber(schoolId); },
    );
  }

  async bulkGenerateInvoices(schoolId: string, dto: any, createdBy: string): Promise<BulkGenerationResult> {
    const students = await this.studentRepository.find({
      where: { classId: dto.classId, schoolId, status: 'active' },
      relations: ['user'],
    });

    // pre-fetch existing invoices for these students to avoid N+1
    const existingInvoices = await this.invoiceRepository.find({
      where: {
        schoolId,
        studentId: In(students.map((s) => s.id)),
        termId: dto.termId,
        status: Not(In([InvoiceStatus.CANCELLED])),
      },
      select: ['studentId'],
    });

    const existingStudentIds = new Set(existingInvoices.map((inv: any) => inv.studentId));

    const results: BulkGenerationResult = { total: students.length, created: 0, skipped: 0, errors: [] };

    for (const student of students) {
      if (existingStudentIds.has(student.id)) {
        results.skipped++;
        continue;
      }
      try {
        await this.createInvoice(
          schoolId,
          {
            studentId: student.id,
            academicYearId: dto.academicYearId,
            termId: dto.termId,
            dueDate: dto.dueDate,
          },
          createdBy,
        );
        results.created++;
      } catch (error: any) {
        results.errors.push({
          studentId: student.id,
          name: `${(student as any).user?.firstName || ''} ${(student as any).user?.lastName || ''}`.trim(),
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAllInvoices(schoolId: string, query: any): Promise<PaginatedResult<any>> {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.termId) where.termId = query.termId;
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    // PERFORMANCE: no payments relation in list
    const [data, total] = await this.invoiceRepository.findAndCount({
      where,
      relations: ['student', 'student.user', 'student.class', 'academicYear', 'term'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const today = new Date();
    const mapped = data.map((inv: any) => {
      let computedStatus = inv.status;
      if (
        inv.status !== InvoiceStatus.PAID &&
        inv.status !== InvoiceStatus.CANCELLED &&
        inv.dueDate &&
        new Date(inv.dueDate) < today &&
        moneyOrZero(inv.balance) > 0
      ) {
        computedStatus = InvoiceStatus.OVERDUE;
      }
      return { ...inv, computedStatus, isOverdue: computedStatus === InvoiceStatus.OVERDUE };
    });

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneInvoice(schoolId: string, id: string): Promise<FeeInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'student.class', 'academicYear', 'term', 'payments'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async sendInvoice(schoolId: string, id: string) {
    const invoice = await this.findOneInvoice(schoolId, id);
    (invoice as any).status = InvoiceStatus.SENT;
    (invoice as any).parentNotified = true;
    (invoice as any).notificationDate = new Date();
    return this.invoiceRepository.save(invoice);
  }

  async cancelInvoice(schoolId: string, id: string) {
    const invoice = await this.findOneInvoice(schoolId, id);
    if (moneyOrZero((invoice as any).amountPaid) > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments. Reverse payments first.');
    }
    (invoice as any).status = InvoiceStatus.CANCELLED;
    return this.invoiceRepository.save(invoice);
  }

  // ============================================
  // PAYMENTS (IDEMPOTENT + TRANSACTIONAL)
  // ============================================

  async createPayment(schoolId: string, dto: any, recordedBy: string): Promise<Payment> {
    const amount = parseMoneyStrict(dto.amount, 'payment amount');
    if (amount <= 0) throw new BadRequestException('Payment amount must be greater than 0');

    return this.dataSource.transaction(async (manager: EntityManager) => {
      // optimistic pre-check
      const preExisting = await this.findExistingPaymentByReference(manager, schoolId, dto);
      if (preExisting) return preExisting;

      // receipt number generated inside tx manager
      const receiptNumber = await this.generateUniqueReceiptNumberTx(manager, schoolId);

      // no-invoice path (still idempotent by reference via unique constraints)
      if (!dto.invoiceId) {
        const student = await manager.getRepository(Student).findOne({
          where: { id: dto.studentId, schoolId },
        });
        if (!student) throw new NotFoundException('Student not found');

        const paymentEntity = manager.getRepository(Payment).create({
          schoolId,
          receiptNumber,
          studentId: dto.studentId,
          invoiceId: undefined,
          amount,
          method: dto.method,
          status: PaymentStatus.COMPLETED,
          paymentDate: dto.paymentDate ?? new Date(),
          transactionReference: dto.transactionReference,
          mpesaReceiptNumber: dto.mpesaReceiptNumber,
          mpesaPhoneNumber: dto.mpesaPhoneNumber,
          bankName: dto.bankName,
          bankBranch: dto.bankBranch,
          chequeNumber: dto.chequeNumber,
          chequeDate: dto.chequeDate,
          payerName: dto.payerName,
          payerPhone: dto.payerPhone,
          payerEmail: dto.payerEmail,
          description: dto.description ?? 'Payment without invoice',
          recordedBy,
          balanceAfter: 0,
        } as Partial<Payment>);

        const res = await this.savePaymentWithIdempotency(manager, paymentEntity as any, schoolId, dto);
        return res.payment;
      }

      // invoice path (lock invoice row)
      const invoice = await manager
        .getRepository(FeeInvoice)
        .createQueryBuilder('invoice')
        .setLock('pessimistic_write')
        .where('invoice.id = :id AND invoice.schoolId = :schoolId', { id: dto.invoiceId, schoolId })
        .getOne();

      if (!invoice) throw new NotFoundException('Invoice not found');

      // validate student match if provided
      if (dto.studentId && dto.studentId !== (invoice as any).studentId) {
        throw new BadRequestException('studentId does not match invoice student');
      }

      // block invalid invoice states
      if ((invoice as any).status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay cancelled invoice');
      }
      if ((invoice as any).status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice already paid');
      }

      const currentBalance = moneyOrZero((invoice as any).balance);
      if (amount > currentBalance) {
        throw new BadRequestException(`Payment (${amount}) exceeds balance (${currentBalance})`);
      }

      const paymentEntity = manager.getRepository(Payment).create({
        schoolId,
        receiptNumber,
        studentId: (invoice as any).studentId,
        invoiceId: dto.invoiceId,
        amount,
        method: dto.method,
        status: PaymentStatus.COMPLETED,
        paymentDate: dto.paymentDate ?? new Date(),
        transactionReference: dto.transactionReference,
        mpesaReceiptNumber: dto.mpesaReceiptNumber,
        mpesaPhoneNumber: dto.mpesaPhoneNumber,
        bankName: dto.bankName,
        bankBranch: dto.bankBranch,
        chequeNumber: dto.chequeNumber,
        chequeDate: dto.chequeDate,
        payerName: dto.payerName,
        payerPhone: dto.payerPhone,
        payerEmail: dto.payerEmail,
        description: dto.description,
        recordedBy,
      } as Partial<Payment>);

      const res = await this.savePaymentWithIdempotency(manager, paymentEntity as any, schoolId, dto);

      // ✅ CRITICAL: if duplicate payment returned, DO NOT update invoice again
      if (!res.created) {
        return res.payment;
      }

      const newAmountPaid = moneyRound(moneyOrZero((invoice as any).amountPaid) + amount);
      const newBalance = moneyRound(currentBalance - amount);

      (invoice as any).amountPaid = newAmountPaid;
      (invoice as any).balance = newBalance;
      (invoice as any).status = newBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await manager.getRepository(FeeInvoice).save(invoice);

      (res.payment as any).balanceAfter = newBalance;
      await manager.getRepository(Payment).save(res.payment);

      return res.payment;
    });
  }

  async findAllPayments(schoolId: string, query: any): Promise<PaginatedResult<Payment>> {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['student', 'student.user', 'invoice'],
      order: { paymentDate: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOnePayment(schoolId: string, id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'invoice'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async reversePayment(schoolId: string, id: string, dto: any, reversedBy: string): Promise<Payment> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const payment = await manager.getRepository(Payment).findOne({ where: { id, schoolId } });
      if (!payment) throw new NotFoundException('Payment not found');
      if ((payment as any).status === PaymentStatus.REVERSED) {
        throw new BadRequestException('Payment already reversed');
      }

      if ((payment as any).invoiceId) {
        const invoice = await manager
          .getRepository(FeeInvoice)
          .createQueryBuilder('invoice')
          .setLock('pessimistic_write')
          .where('invoice.id = :id AND invoice.schoolId = :schoolId', { id: (payment as any).invoiceId, schoolId })
          .getOne();

        if (invoice) {
          const paymentAmount = moneyOrZero((payment as any).amount);
          const currentAmountPaid = moneyOrZero((invoice as any).amountPaid);
          const newAmountPaid = moneyRound(currentAmountPaid - paymentAmount);

          if (newAmountPaid < 0) {
            throw new BadRequestException(`Reversal (${paymentAmount}) exceeds paid (${currentAmountPaid})`);
          }

          (invoice as any).amountPaid = newAmountPaid;
          (invoice as any).balance = moneyRound(moneyOrZero((invoice as any).balance) + paymentAmount);
          (invoice as any).status =
            newAmountPaid <= 0
              ? ((invoice as any).parentNotified ? InvoiceStatus.SENT : InvoiceStatus.DRAFT)
              : InvoiceStatus.PARTIALLY_PAID;

          await manager.getRepository(FeeInvoice).save(invoice);
        }
      }

      (payment as any).status = PaymentStatus.REVERSED;
      (payment as any).reversedBy = reversedBy;
      (payment as any).reversalDate = new Date();
      (payment as any).reversalReason = dto.reason;

      return manager.getRepository(Payment).save(payment);
    });
  }

  // ============================================
  // REPORTS / ANALYTICS (methods your controller calls)
  // ============================================

  async getStudentFeeStatement(schoolId: string, studentId: string, query: any) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, schoolId },
      relations: ['user', 'class'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const invoiceWhere: any = { schoolId, studentId };
    if (query.academicYearId) invoiceWhere.academicYearId = query.academicYearId;

    const invoices = await this.invoiceRepository.find({
      where: invoiceWhere,
      relations: ['term', 'academicYear'],
      order: { issueDate: 'DESC' },
    });

    const paymentWhere: any = { schoolId, studentId };
    // support fromDate/toDate filtering if provided
    const fromDate = query.fromDate ?? query.startDate;
    const toDate = query.toDate ?? query.endDate;
    if (fromDate && toDate) {
      const [fy, fm, fd] = String(fromDate).split('-').map(Number);
      const [ty, tm, td] = String(toDate).split('-').map(Number);
      paymentWhere.paymentDate = Between(
        new Date(fy, fm - 1, fd, 0, 0, 0, 0),
        new Date(ty, tm - 1, td, 23, 59, 59, 999),
      );
    }

    const payments = await this.paymentRepository.find({
      where: paymentWhere,
      order: { paymentDate: 'DESC' },
    });

    const totalBilled = invoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.totalAmount)), 0);
    const totalPaid = payments
      .filter((p: any) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p: any) => moneyRound(sum + moneyOrZero(p.amount)), 0);

    return {
      student: {
        id: student.id,
        admissionNumber: (student as any).admissionNumber,
        name: `${(student as any).user?.firstName || ''} ${(student as any).user?.lastName || ''}`.trim(),
        class: (student as any).class?.name,
      },
      summary: {
        totalBilled,
        totalPaid,
        currentBalance: moneyRound(totalBilled - totalPaid),
        currency: 'KES',
      },
      invoices,
      payments,
    };
  }

  async getClassFeesSummary(schoolId: string, classId: string, termId?: string) {
    const classEntity = await this.classRepository.findOne({ where: { id: classId, schoolId } });
    if (!classEntity) throw new NotFoundException('Class not found');

    const students = await this.studentRepository.find({
      where: { classId, schoolId, status: 'active' },
      relations: ['user'],
    });
    const studentIds = students.map((s) => s.id);

    const invoiceWhere: any = { schoolId, studentId: In(studentIds) };
    if (termId) invoiceWhere.termId = termId;

    const invoices = studentIds.length
      ? await this.invoiceRepository.find({ where: invoiceWhere })
      : [];

    const totalExpected = invoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.totalAmount)), 0);
    const totalCollected = invoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.amountPaid)), 0);
    const totalOutstanding = invoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.balance)), 0);

    const studentsSummary = students.map((student) => {
      const studentInvoices = invoices.filter((i: any) => i.studentId === student.id);
      const billed = studentInvoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.totalAmount)), 0);
      const paid = studentInvoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.amountPaid)), 0);
      return {
        studentId: student.id,
        admissionNumber: (student as any).admissionNumber,
        name: `${(student as any).user?.firstName || ''} ${(student as any).user?.lastName || ''}`.trim(),
        billed,
        paid,
        balance: moneyRound(billed - paid),
        status: billed === 0 ? 'no_invoice' : paid >= billed ? 'cleared' : paid > 0 ? 'partial' : 'unpaid',
      };
    });

    return {
      class: { id: classEntity.id, name: classEntity.name, section: (classEntity as any).section },
      summary: {
        totalStudents: students.length,
        totalExpected,
        totalCollected,
        totalOutstanding,
        collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0',
        currency: 'KES',
      },
      students: studentsSummary,
    };
  }

  async getPaymentMethodsBreakdown(schoolId: string, query: any) {
    const where: any = { schoolId, status: PaymentStatus.COMPLETED };

    const start = query.fromDate ?? query.startDate;
    const end = query.toDate ?? query.endDate;

    if (start && end) {
      const [sy, sm, sd] = String(start).split('-').map(Number);
      const [ey, em, ed] = String(end).split('-').map(Number);
      where.paymentDate = Between(
        new Date(sy, sm - 1, sd, 0, 0, 0, 0),
        new Date(ey, em - 1, ed, 23, 59, 59, 999),
      );
    }

    const payments = await this.paymentRepository.find({ where });

    const breakdown: Record<string, { count: number; total: number; percentage: number }> = {};
    let grandTotal = 0;

    for (const p of payments as any[]) {
      const amt = moneyOrZero(p.amount);
      grandTotal = moneyRound(grandTotal + amt);

      if (!breakdown[p.method]) breakdown[p.method] = { count: 0, total: 0, percentage: 0 };
      breakdown[p.method].count++;
      breakdown[p.method].total = moneyRound(breakdown[p.method].total + amt);
    }

    for (const method in breakdown) {
      breakdown[method].percentage =
        grandTotal > 0 ? parseFloat(((breakdown[method].total / grandTotal) * 100).toFixed(1)) : 0;
    }

    return {
      period: { fromDate: start, toDate: end },
      summary: {
        totalTransactions: payments.length,
        totalAmount: grandTotal,
        currency: 'KES',
      },
      breakdown,
    };
  }

  async getDefaultersList(schoolId: string, query: any) {
    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('invoice.term', 'term')
      .where('invoice.schoolId = :schoolId', { schoolId })
      .andWhere('invoice.status NOT IN (:...excluded)', {
        excluded: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      })
      .andWhere('invoice.balance > 0')
      .orderBy('invoice.balance', 'DESC');

    if (query.classId) qb.andWhere('student.classId = :classId', { classId: query.classId });

    const invoices = await qb.getMany();

    return {
      defaulters: invoices.map((inv: any) => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.student?.id,
        admissionNumber: inv.student?.admissionNumber,
        studentName: inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : 'N/A',
        class: inv.student?.class?.name,
        classId: inv.student?.class?.id,
        totalAmount: moneyOrZero(inv.totalAmount),
        amountPaid: moneyOrZero(inv.amountPaid),
        balance: moneyOrZero(inv.balance),
        invoiceStatus: inv.status,
        isOverdue: inv.status === InvoiceStatus.OVERDUE,
        term: inv.term?.name,
      })),
      summary: {
        totalDefaulters: invoices.length,
        totalOutstanding: invoices.reduce((sum: number, d: any) => moneyRound(sum + moneyOrZero(d.balance)), 0),
        currency: 'KES',
      },
    };
  }

  async getDailyCollectionReport(schoolId: string, dateStr: string) {
    // dateStr expects YYYY-MM-DD
    const [year, month, day] = String(dateStr).split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        paymentDate: Between(startOfDay, endOfDay),
        status: PaymentStatus.COMPLETED,
      },
      relations: ['student', 'student.user'],
      order: { paymentDate: 'ASC' },
    });

    const byMethod: Record<string, { count: number; total: number }> = {};
    let totalAmount = 0;

    for (const p of payments as any[]) {
      const amt = moneyOrZero(p.amount);
      totalAmount = moneyRound(totalAmount + amt);
      if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
      byMethod[p.method].count++;
      byMethod[p.method].total = moneyRound(byMethod[p.method].total + amt);
    }

    return {
      date: dateStr,
      payments: payments.map((p: any) => ({
        receiptNumber: p.receiptNumber,
        time: p.paymentDate,
        student: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
        admissionNumber: p.student?.admissionNumber,
        amount: moneyOrZero(p.amount),
        method: p.method,
        reference: p.transactionReference || p.mpesaReceiptNumber || p.chequeNumber,
        recordedBy: p.recordedBy,
      })),
      summary: {
        totalTransactions: payments.length,
        totalAmount,
        byMethod,
        currency: 'KES',
      },
    };
  }

  async getTermlyCollectionSummary(schoolId: string, termId: string) {
    const term = await this.termRepository.findOne({
      where: { id: termId, schoolId },
      relations: ['academicYear'],
    });
    if (!term) throw new NotFoundException('Term not found');

    const invoices = await this.invoiceRepository.find({ where: { schoolId, termId } });

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        invoiceId: In(invoices.map((i: any) => i.id)),
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalExpected = invoices.reduce((sum, inv: any) => moneyRound(sum + moneyOrZero(inv.totalAmount)), 0);
    const totalCollected = payments.reduce((sum, p: any) => moneyRound(sum + moneyOrZero(p.amount)), 0);

    return {
      term: {
        id: term.id,
        name: (term as any).name,
        academicYear: (term as any).academicYear?.name,
        startDate: (term as any).startDate,
        endDate: (term as any).endDate,
      },
      summary: {
        totalInvoices: invoices.length,
        totalExpected,
        totalCollected,
        totalOutstanding: moneyRound(totalExpected - totalCollected),
        collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0',
        currency: 'KES',
      },
      statusBreakdown: {
        paid: invoices.filter((i: any) => i.status === InvoiceStatus.PAID).length,
        partiallyPaid: invoices.filter((i: any) => i.status === InvoiceStatus.PARTIALLY_PAID).length,
        unpaid: invoices.filter((i: any) => [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(i.status)).length,
        overdue: invoices.filter((i: any) => i.status === InvoiceStatus.OVERDUE).length,
        cancelled: invoices.filter((i: any) => i.status === InvoiceStatus.CANCELLED).length,
      },
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async findExistingPaymentByReference(manager: EntityManager, schoolId: string, dto: any): Promise<Payment | null> {
    const repo = manager.getRepository(Payment);

    if (dto.mpesaReceiptNumber) {
      const existing = await repo.findOne({ where: { schoolId, mpesaReceiptNumber: dto.mpesaReceiptNumber } as any });
      if (existing) return existing;
    }
    if (dto.transactionReference) {
      const existing = await repo.findOne({ where: { schoolId, transactionReference: dto.transactionReference } as any });
      if (existing) return existing;
    }
    if (dto.chequeNumber) {
      const existing = await repo.findOne({ where: { schoolId, chequeNumber: dto.chequeNumber } as any });
      if (existing) return existing;
    }
    return null;
  }

  // TRUE idempotency: on unique violation, return existing payment or retry receipt collisions.
  private async savePaymentWithIdempotency(
    manager: EntityManager,
    payment: Payment,
    schoolId: string,
    dto: any,
    maxRetries = 3,
  ): Promise<SavePaymentResult> {
    const repo = manager.getRepository(Payment);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const saved = await repo.save(payment);
        return { payment: saved, created: true };
      } catch (error: any) {
        if (error?.code === '23505') {
          const detail = String(error.detail ?? '').toLowerCase();
          const constraint = String(error.constraint ?? '').toLowerCase();

          const isReferenceCollision =
            detail.includes('mpesa') || constraint.includes('mpesa') ||
            detail.includes('transaction') || constraint.includes('transaction') ||
            detail.includes('cheque') || constraint.includes('cheque');

          if (isReferenceCollision) {
            const existing = await this.findExistingPaymentByReference(manager, schoolId, dto);
            if (existing) return { payment: existing, created: false };
          }

          const isReceiptCollision =
            detail.includes('receipt') || constraint.includes('receipt');

          if (isReceiptCollision) {
            (payment as any).receiptNumber = await this.generateUniqueReceiptNumberTx(manager, schoolId);
            continue;
          }

          // unknown unique constraint: attempt lookup anyway
          const existing = await this.findExistingPaymentByReference(manager, schoolId, dto);
          if (existing) return { payment: existing, created: false };
        }

        throw error;
      }
    }

    // final fallback
    (payment as any).receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const saved = await repo.save(payment);
    return { payment: saved, created: true };
  }

  private async generateUniqueReceiptNumberTx(manager: EntityManager, schoolId: string, maxRetries = 5): Promise<string> {
    const repo = manager.getRepository(Payment);
    for (let i = 0; i < maxRetries; i++) {
      const num = `RCP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
      const exists = await repo.findOne({ where: { schoolId, receiptNumber: num } as any });
      if (!exists) return num;
    }
    return `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async generateUniqueInvoiceNumber(schoolId: string, maxRetries = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const num = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
      const exists = await this.invoiceRepository.findOne({ where: { schoolId, invoiceNumber: num } as any });
      if (!exists) return num;
    }
    return `INV-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async saveWithRetry<T>(saveFn: () => Promise<T>, regenerateFn: () => Promise<void>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await saveFn();
      } catch (error: any) {
        if (error?.code === '23505') {
          await regenerateFn();
          continue;
        }
        throw error;
      }
    }
    await regenerateFn();
    return saveFn();
  }

  private calculateDueDate(daysFromNow: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d;
  }
}
