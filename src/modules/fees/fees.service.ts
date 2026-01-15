/**
 * FEES SERVICE - PRODUCTION READY v2
 * ===================================
 * Fixes applied:
 * 1. ✅ Fixed schoolId in transaction queries (was school_id)
 * 2. ✅ Made invoiceId optional in createPayment
 * 3. ✅ Added validation for zero/negative amounts
 * 4. ✅ Fixed reversal status logic (respects DRAFT vs SENT)
 * 5. ✅ Added retry logic for invoice/receipt number collisions
 * 6. ✅ Fixed boarder/day scholar template logic
 * 7. ✅ Added pagination to list endpoints
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Between, DataSource } from 'typeorm';
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
// EXPORTED INTERFACES
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

// ============================================
// EXPORTED CONSTANTS (for index.ts)
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

export const CAPITATION_DISBURSEMENT = {
  term1: 0.5,
  term2: 0.3,
  term3: 0.2,
};

export const PUBLIC_SCHOOL_FEE_TEMPLATES = {
  national_boarding: {
    name: 'National School (Boarding)',
    category: 'national',
    type: 'boarding',
    totalAnnual: 75798,
    gokSubsidy: 22244,
    parentPays: 53554,
  },
  extra_county_a_boarding: {
    name: 'Extra County A (Boarding)',
    category: 'extra_county_a',
    type: 'boarding',
    totalAnnual: 75798,
    gokSubsidy: 22244,
    parentPays: 53554,
  },
  extra_county_b_boarding: {
    name: 'Extra County B (Boarding)',
    category: 'extra_county_b',
    type: 'boarding',
    totalAnnual: 62779,
    gokSubsidy: 22244,
    parentPays: 40535,
  },
  county_boarding: {
    name: 'County School (Boarding)',
    category: 'county',
    type: 'boarding',
    totalAnnual: 55000,
    gokSubsidy: 22244,
    parentPays: 32756,
  },
  sub_county_boarding: {
    name: 'Sub-County School (Boarding)',
    category: 'sub_county',
    type: 'boarding',
    totalAnnual: 45000,
    gokSubsidy: 22244,
    parentPays: 22756,
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
  { name: 'Stanbic Bank', paybill: '600100', code: 'STANBIC' },
  { name: 'ABSA Bank Kenya', paybill: '303030', code: 'ABSA' },
  { name: 'Diamond Trust Bank', paybill: '516516', code: 'DTB' },
  { name: 'NCBA Bank', paybill: '880100', code: 'NCBA' },
  { name: 'Family Bank', paybill: '222111', code: 'FAMILY' },
  { name: 'I&M Bank', paybill: '542542', code: 'IM' },
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
  { code: 'sibling_4', name: 'Sibling Discount (4th+ child)', percentage: 20 },
  { code: 'staff_child', name: 'Staff Child Discount', percentage: 25 },
  { code: 'early_payment', name: 'Early Payment Discount', percentage: 5 },
  { code: 'full_year', name: 'Full Year Payment Discount', percentage: 10 },
];

export const BURSARY_TYPES = [
  { code: BursarySource.NG_CDF, name: 'NG-CDF (National Government CDF)', description: 'Constituency Development Fund bursaries' },
  { code: BursarySource.COUNTY, name: 'County Government Bursary', description: 'County-level education bursaries' },
  { code: BursarySource.PRESIDENTIAL, name: 'Presidential Secondary School Bursary (PSSB)', description: 'National government merit-based bursary' },
  { code: BursarySource.HELB, name: 'HELB', description: 'Higher Education Loans Board' },
  { code: BursarySource.CONSTITUENCY, name: 'Constituency Bursary', description: 'MP constituency office bursaries' },
  { code: BursarySource.CORPORATE, name: 'Corporate Sponsorship', description: 'Company/corporate bursaries' },
  { code: BursarySource.NGO, name: 'NGO Bursary', description: 'Non-governmental organization bursaries' },
  { code: BursarySource.RELIGIOUS, name: 'Religious Organization', description: 'Church/mosque/temple bursaries' },
  { code: BursarySource.PRIVATE, name: 'Private Sponsor', description: 'Individual private sponsors' },
];

// ============================================
// SERVICE CLASS
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
        { category: FeeCategory.ACTIVITY, name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
        { category: FeeCategory.MAINTENANCE, name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
        { category: FeeCategory.OTHER, name: 'Quality Assurance (GOK)', amount: 1077, isGovt: true },
        { category: FeeCategory.OTHER, name: 'SMASSE (GOK)', amount: 600, isGovt: true },
        { category: FeeCategory.OTHER, name: 'ICT (GOK)', amount: 2400, isGovt: true },
        { category: FeeCategory.BOARDING, name: 'Boarding Fee', amount: 40535, isGovt: false },
        { category: FeeCategory.MAINTENANCE, name: 'M&I (Parent)', amount: 7000, isGovt: false },
        { category: FeeCategory.ACTIVITY, name: 'Activity Fee (Parent)', amount: 3000, isGovt: false },
        { category: FeeCategory.MEDICAL, name: 'Medical & Insurance', amount: 2000, isGovt: false },
        { category: FeeCategory.OTHER, name: 'Other Vote Heads', amount: 1019, isGovt: false },
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
        { category: FeeCategory.ACTIVITY, name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
        { category: FeeCategory.MAINTENANCE, name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
        { category: FeeCategory.OTHER, name: 'Quality Assurance (GOK)', amount: 1077, isGovt: true },
        { category: FeeCategory.OTHER, name: 'SMASSE (GOK)', amount: 600, isGovt: true },
        { category: FeeCategory.OTHER, name: 'ICT (GOK)', amount: 2400, isGovt: true },
      ],
    },
  };

  // ============================================
  // REFERENCE DATA METHODS
  // ============================================

  getPublicSchoolFeeTemplates() {
    return Object.entries(this.publicSchoolTemplates).map(([key, template]) => ({
      key,
      ...template,
    }));
  }

  getPrivateSchoolFeeRanges() {
    return PRIVATE_SCHOOL_FEE_RANGES;
  }

  getKenyaBanks() {
    return KENYA_BANKS;
  }

  getFeeCategories() {
    return getEnumValues(FeeCategory).map(category => ({
      value: category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }

  getBursaryTypes() {
    return BURSARY_TYPES;
  }

  getDiscountTypes() {
    return DISCOUNT_TYPES;
  }

  // ============================================
  // FEE STRUCTURE MANAGEMENT
  // ============================================

  async createFeeStructure(schoolId: string, dto: any, createdBy: string): Promise<FeeStructure> {
    // FIX #3: Validate amount
    const amount = parseFloat(String(dto.amount));
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Fee amount must be a positive number');
    }

    const feeStructure = this.feeStructureRepository.create({
      ...dto,
      amount,
      schoolId,
      createdBy,
    } as Partial<FeeStructure>);
    return this.feeStructureRepository.save(feeStructure);
  }

  /**
   * FIX #6: Corrected boarder/day scholar logic
   */
  async createFromTemplate(
    schoolId: string,
    templateKey: string,
    academicYearId: string,
    createdBy: string,
  ): Promise<FeeStructure[]> {
    const template = this.publicSchoolTemplates[templateKey];
    if (!template) {
      throw new NotFoundException(`Template '${templateKey}' not found`);
    }

    // FIX #6: Proper boarder/day logic
    const isBoardingTemplate = template.type === 'boarding';
    const isDayTemplate = template.type === 'day';

    const feeStructures: FeeStructure[] = [];

    for (const voteHead of template.voteHeads) {
      const feeStructure = this.feeStructureRepository.create({
        schoolId,
        name: voteHead.name,
        category: voteHead.category as FeeCategory,
        amount: voteHead.amount,
        frequency: FeeFrequency.PER_TERM,
        academicYearId,
        isGovernmentFee: voteHead.isGovt,
        isMandatory: true,
        // FIX #6: Day template = day scholars only, Boarding template = boarders only
        // GOK fees apply to both
        forBoarders: isBoardingTemplate || voteHead.isGovt,
        forDayScholars: isDayTemplate || voteHead.isGovt,
        isActive: true,
        createdBy,
      } as Partial<FeeStructure>);
      feeStructures.push(feeStructure);
    }

    return this.feeStructureRepository.save(feeStructures);
  }

  async findAllFeeStructures(schoolId: string, query: any): Promise<FeeStructure[]> {
    const where: any = { schoolId };
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.feeStructureRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOneFeeStructure(schoolId: string, id: string): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async updateFeeStructure(schoolId: string, id: string, dto: any): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // FIX #3: Validate amount if provided
    if (dto.amount !== undefined) {
      const amount = parseFloat(String(dto.amount));
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException('Fee amount must be a positive number');
      }
      dto.amount = amount;
    }

    Object.assign(feeStructure, dto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async removeFeeStructure(schoolId: string, id: string): Promise<void> {
    const result = await this.feeStructureRepository.delete({ id, schoolId });
    if (result.affected === 0) {
      throw new NotFoundException('Fee structure not found');
    }
  }

  // ============================================
  // INVOICE MANAGEMENT
  // ============================================

  async createInvoice(schoolId: string, dto: any, createdBy: string): Promise<FeeInvoice> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, schoolId },
      relations: ['class', 'user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (dto.termId) {
      const existingInvoice = await this.invoiceRepository.findOne({
        where: {
          schoolId,
          studentId: dto.studentId,
          termId: dto.termId,
          status: Not(In([InvoiceStatus.CANCELLED])),
        },
      });

      if (existingInvoice) {
        throw new ConflictException('Invoice already exists for this student and term');
      }
    }

    const feeStructures = await this.feeStructureRepository.find({
      where: {
        schoolId,
        isActive: true,
        academicYearId: dto.academicYearId,
      },
    });

    const applicableFees = feeStructures.filter(fee => {
      if (fee.forBoarders && fee.forDayScholars) return true;
      if ((student as any).isBoarder && fee.forBoarders) return true;
      if (!(student as any).isBoarder && fee.forDayScholars) return true;
      return false;
    });

    let items = dto.items || [];
    if (items.length === 0) {
      items = applicableFees.map(fee => ({
        feeStructureId: fee.id,
        name: fee.name,
        category: fee.category,
        amount: parseFloat(String(fee.amount)) || 0,
        quantity: 1,
        total: parseFloat(String(fee.amount)) || 0,
        isGovernmentFee: fee.isGovernmentFee,
      }));
    }

    const subtotal = items.reduce((sum: number, item: any) => {
      const itemTotal = parseFloat(String(item.total)) || parseFloat(String(item.amount)) * (item.quantity || 1);
      return sum + itemTotal;
    }, 0);

    const governmentSubsidy = items
      .filter((item: any) => item.isGovernmentFee)
      .reduce((sum: number, item: any) => {
        const itemTotal = parseFloat(String(item.total)) || parseFloat(String(item.amount));
        return sum + itemTotal;
      }, 0);

    const discountAmount = parseFloat(String(dto.discountAmount)) || 0;
    const bursaryAmount = parseFloat(String(dto.bursaryAmount)) || 0;
    const totalAmount = subtotal - governmentSubsidy - discountAmount - bursaryAmount;

    // FIX #3: Validate total is not negative
    if (totalAmount < 0) {
      throw new BadRequestException('Total amount cannot be negative. Check discount and bursary amounts.');
    }

    // FIX #5: Generate unique invoice number with retry
    const invoiceNumber = await this.generateUniqueInvoiceNumber(schoolId);

    const invoice = this.invoiceRepository.create({
      schoolId,
      invoiceNumber,
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
      issueDate: dto.issueDate || new Date(),
      dueDate: dto.dueDate || this.calculateDueDate(14),
      notes: dto.notes,
      createdBy,
    });

    return this.invoiceRepository.save(invoice);
  }

  async bulkGenerateInvoices(
    schoolId: string,
    dto: any,
    createdBy: string,
  ): Promise<BulkGenerationResult> {
    const students = await this.studentRepository.find({
      where: { classId: dto.classId, schoolId, status: 'active' },
      relations: ['user'],
    });

    const results: BulkGenerationResult = {
      total: students.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const student of students) {
      try {
        const existingInvoice = await this.invoiceRepository.findOne({
          where: {
            schoolId,
            studentId: student.id,
            termId: dto.termId,
            status: Not(In([InvoiceStatus.CANCELLED])),
          },
        });

        if (existingInvoice) {
          results.skipped++;
          continue;
        }

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
      } catch (error) {
        results.errors.push({
          studentId: student.id,
          name: student.user?.firstName + ' ' + student.user?.lastName,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * FIX #7: Added pagination
   */
  async findAllInvoices(schoolId: string, query: any): Promise<PaginatedResult<any>> {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.termId) where.termId = query.termId;
    if (query.status) where.status = query.status;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where,
      relations: ['student', 'student.user', 'student.class', 'academicYear', 'term', 'payments'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const today = new Date();
    const data = invoices.map(invoice => {
      let computedStatus = invoice.status;

      if (
        invoice.status !== InvoiceStatus.PAID &&
        invoice.status !== InvoiceStatus.CANCELLED &&
        invoice.dueDate &&
        new Date(invoice.dueDate) < today &&
        parseFloat(String(invoice.balance)) > 0
      ) {
        computedStatus = InvoiceStatus.OVERDUE;
      }

      return {
        ...invoice,
        computedStatus,
        isOverdue: computedStatus === InvoiceStatus.OVERDUE,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneInvoice(schoolId: string, id: string): Promise<FeeInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'student.class', 'academicYear', 'term', 'payments'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async sendInvoice(schoolId: string, id: string): Promise<FeeInvoice> {
    const invoice = await this.findOneInvoice(schoolId, id);

    invoice.status = InvoiceStatus.SENT;
    invoice.parentNotified = true;
    invoice.notificationDate = new Date();

    return this.invoiceRepository.save(invoice);
  }

  async cancelInvoice(schoolId: string, id: string): Promise<FeeInvoice> {
    const invoice = await this.findOneInvoice(schoolId, id);

    if (parseFloat(String(invoice.amountPaid)) > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments. Reverse payments first.');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    return this.invoiceRepository.save(invoice);
  }

  // ============================================
  // PAYMENT MANAGEMENT - TRANSACTIONAL
  // ============================================

  /**
   * FIX #1: Fixed schoolId in query (was school_id)
   * FIX #2: Made invoiceId optional
   * FIX #3: Added amount validation
   */
  async createPayment(schoolId: string, dto: any, recordedBy: string): Promise<Payment> {
    // FIX #3: Validate amount
    const amount = parseFloat(String(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // FIX #5: Generate unique receipt number
    const receiptNumber = await this.generateUniqueReceiptNumber(schoolId);

    // FIX #2: If no invoiceId, create payment without invoice locking
    if (!dto.invoiceId) {
      // Validate student exists
      const student = await this.studentRepository.findOne({
        where: { id: dto.studentId, schoolId },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      const payment = this.paymentRepository.create({
        schoolId,
        receiptNumber,
        studentId: dto.studentId,
        invoiceId: undefined,
        amount,
        method: dto.method,
        status: PaymentStatus.COMPLETED,
        paymentDate: dto.paymentDate || new Date(),
        transactionReference: dto.transactionReference,
        mpesaReceiptNumber: dto.mpesaReceiptNumber,
        mpesaPhoneNumber: dto.mpesaPhoneNumber,
        bankName: dto.bankName,
        bankBranch: dto.bankBranch,
        chequeNumber: dto.chequeNumber,
        chequeDate: dto.chequeDate,
        payerName: dto.payerName,
        payerPhone: dto.payerPhone,
        description: dto.description || 'Payment without invoice',
        recordedBy,
      } as Partial<Payment>);

      return this.paymentRepository.save(payment);
    }

    // With invoiceId - use transaction with locking
    return this.dataSource.transaction(async (manager) => {
      // FIX #1: Use property name 'schoolId' not column name 'school_id'
      const invoice = await manager
        .getRepository(FeeInvoice)
        .createQueryBuilder('invoice')
        .setLock('pessimistic_write')
        .where('invoice.id = :id AND invoice.schoolId = :schoolId', {
          id: dto.invoiceId,
          schoolId,
        })
        .getOne();

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      const currentBalance = parseFloat(String(invoice.balance)) || 0;

      if (amount > currentBalance) {
        throw new BadRequestException(`Payment amount (${amount}) exceeds balance (${currentBalance})`);
      }

      const payment = manager.getRepository(Payment).create({
        schoolId,
        receiptNumber,
        studentId: dto.studentId || invoice.studentId,
        invoiceId: dto.invoiceId,
        amount,
        method: dto.method,
        status: PaymentStatus.COMPLETED,
        paymentDate: dto.paymentDate || new Date(),
        transactionReference: dto.transactionReference,
        mpesaReceiptNumber: dto.mpesaReceiptNumber,
        mpesaPhoneNumber: dto.mpesaPhoneNumber,
        bankName: dto.bankName,
        bankBranch: dto.bankBranch,
        chequeNumber: dto.chequeNumber,
        chequeDate: dto.chequeDate,
        payerName: dto.payerName,
        payerPhone: dto.payerPhone,
        description: dto.description,
        recordedBy,
      } as Partial<Payment>);

      const savedPayment = await manager.getRepository(Payment).save(payment);

      const currentAmountPaid = parseFloat(String(invoice.amountPaid)) || 0;
      const newAmountPaid = currentAmountPaid + amount;
      const newBalance = currentBalance - amount;

      invoice.amountPaid = newAmountPaid;
      invoice.balance = newBalance;
      invoice.status = newBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await manager.getRepository(FeeInvoice).save(invoice);

      savedPayment.balanceAfter = newBalance;
      await manager.getRepository(Payment).save(savedPayment);

      return savedPayment;
    });
  }

  /**
   * FIX #1: Added schoolId to lock query
   * FIX #4: Fixed reversal status logic
   */
  async reversePayment(schoolId: string, id: string, dto: any, reversedBy: string): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.getRepository(Payment).findOne({
        where: { id, schoolId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.status === PaymentStatus.REVERSED) {
        throw new BadRequestException('Payment already reversed');
      }

      // Only update invoice if payment was linked to one
      if (payment.invoiceId) {
        // FIX #1: Use property name and include schoolId
        const invoice = await manager
          .getRepository(FeeInvoice)
          .createQueryBuilder('invoice')
          .setLock('pessimistic_write')
          .where('invoice.id = :id AND invoice.schoolId = :schoolId', {
            id: payment.invoiceId,
            schoolId,
          })
          .getOne();

        if (invoice) {
          const amount = parseFloat(String(payment.amount)) || 0;
          const currentAmountPaid = parseFloat(String(invoice.amountPaid)) || 0;
          const currentBalance = parseFloat(String(invoice.balance)) || 0;

          invoice.amountPaid = currentAmountPaid - amount;
          invoice.balance = currentBalance + amount;

          // FIX #4: Respect original status (DRAFT vs SENT)
          if (invoice.amountPaid <= 0) {
            // Return to original unpaid status
            invoice.status = invoice.parentNotified ? InvoiceStatus.SENT : InvoiceStatus.DRAFT;
          } else {
            invoice.status = InvoiceStatus.PARTIALLY_PAID;
          }

          await manager.getRepository(FeeInvoice).save(invoice);
        }
      }

      payment.status = PaymentStatus.REVERSED;
      payment.reversedBy = reversedBy;
      payment.reversalDate = new Date();
      payment.reversalReason = dto.reason;

      return manager.getRepository(Payment).save(payment);
    });
  }

  /**
   * FIX #7: Added pagination
   */
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOnePayment(schoolId: string, id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, schoolId },
      relations: ['student', 'student.user', 'invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================

  async getStudentFeeStatement(schoolId: string, studentId: string, query: any): Promise<any> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, schoolId },
      relations: ['user', 'class'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const invoiceWhere: any = { schoolId, studentId };
    if (query.academicYearId) invoiceWhere.academicYearId = query.academicYearId;

    const invoices = await this.invoiceRepository.find({
      where: invoiceWhere,
      relations: ['term', 'academicYear'],
      order: { issueDate: 'DESC' },
    });

    const payments = await this.paymentRepository.find({
      where: { schoolId, studentId },
      order: { paymentDate: 'DESC' },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.totalAmount)) || 0), 0);
    const totalPaid = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
    const currentBalance = totalBilled - totalPaid;

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        name: `${student.user?.firstName} ${student.user?.lastName}`,
        class: student.class?.name,
      },
      summary: {
        totalBilled,
        totalPaid,
        currentBalance,
        currency: 'KES',
      },
      invoices,
      payments,
    };
  }

  async getClassFeesSummary(schoolId: string, classId: string, termId?: string): Promise<any> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const students = await this.studentRepository.find({
      where: { classId, schoolId, status: 'active' },
      relations: ['user'],
    });

    const invoiceWhere: any = {
      schoolId,
      studentId: In(students.map(s => s.id)),
    };
    if (termId) invoiceWhere.termId = termId;

    const invoices = await this.invoiceRepository.find({ where: invoiceWhere });

    const totalExpected = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.totalAmount)) || 0), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.amountPaid)) || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.balance)) || 0), 0);

    const studentsSummary = students.map(student => {
      const studentInvoices = invoices.filter(i => i.studentId === student.id);
      const billed = studentInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.totalAmount)) || 0), 0);
      const paid = studentInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.amountPaid)) || 0), 0);

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        name: `${student.user?.firstName} ${student.user?.lastName}`,
        billed,
        paid,
        balance: billed - paid,
        status: billed === 0 ? 'no_invoice' : paid >= billed ? 'cleared' : paid > 0 ? 'partial' : 'unpaid',
      };
    });

    return {
      class: {
        id: classEntity.id,
        name: classEntity.name,
        section: classEntity.section,
      },
      summary: {
        totalStudents: students.length,
        totalExpected,
        totalCollected,
        totalOutstanding,
        collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0,
        currency: 'KES',
      },
      students: studentsSummary,
    };
  }

  async getDefaultersList(schoolId: string, query: any): Promise<any[]> {
    const where: any = {
      schoolId,
      status: Not(In([InvoiceStatus.PAID, InvoiceStatus.CANCELLED])),
    };

    const invoices = await this.invoiceRepository.find({
      where,
      relations: ['student', 'student.user', 'student.class', 'term'],
      order: { balance: 'DESC' },
    });

    let filteredInvoices = invoices;
    if (query.classId) {
      filteredInvoices = invoices.filter(inv => inv.student?.classId === query.classId);
    }

    const defaulters = filteredInvoices
      .filter(inv => parseFloat(String(inv.balance)) > 0)
      .map(inv => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.student?.id,
        admissionNumber: inv.student?.admissionNumber,
        studentName: inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : 'N/A',
        className: inv.student?.class?.name || 'N/A',
        termName: inv.term?.name,
        totalAmount: parseFloat(String(inv.totalAmount)) || 0,
        amountPaid: parseFloat(String(inv.amountPaid)) || 0,
        balance: parseFloat(String(inv.balance)) || 0,
        dueDate: inv.dueDate,
        daysOverdue: inv.dueDate ? Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0,
      }));

    return defaulters;
  }

  async getDailyCollectionReport(schoolId: string, dateStr: string): Promise<any> {
    const [year, month, day] = dateStr.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        paymentDate: Between(startOfDay, endOfDay),
        status: PaymentStatus.COMPLETED,
      },
      relations: ['student', 'student.user', 'invoice'],
      order: { paymentDate: 'ASC' },
    });

    const byMethod: Record<string, { count: number; total: number }> = {};
    let totalAmount = 0;

    for (const payment of payments) {
      const amount = parseFloat(String(payment.amount)) || 0;
      totalAmount += amount;

      if (!byMethod[payment.method]) {
        byMethod[payment.method] = { count: 0, total: 0 };
      }
      byMethod[payment.method].count++;
      byMethod[payment.method].total += amount;
    }

    return {
      date: dateStr,
      summary: {
        totalTransactions: payments.length,
        totalAmount,
        currency: 'KES',
      },
      byMethod,
      payments: payments.map(p => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
        admissionNumber: p.student?.admissionNumber,
        amount: parseFloat(String(p.amount)) || 0,
        method: p.method,
        reference: p.transactionReference || p.mpesaReceiptNumber || p.chequeNumber,
        time: p.paymentDate,
      })),
    };
  }

  async getPaymentMethodsBreakdown(schoolId: string, query: any): Promise<any> {
    const where: any = { schoolId, status: PaymentStatus.COMPLETED };

    if (query.startDate && query.endDate) {
      const [startYear, startMonth, startDay] = query.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = query.endDate.split('-').map(Number);
      const startOfDay = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const endOfDay = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      where.paymentDate = Between(startOfDay, endOfDay);
    }

    const payments = await this.paymentRepository.find({ where });

    const breakdown: Record<string, { count: number; total: number; percentage: number }> = {};
    let grandTotal = 0;

    for (const payment of payments) {
      const amount = parseFloat(String(payment.amount)) || 0;
      grandTotal += amount;

      if (!breakdown[payment.method]) {
        breakdown[payment.method] = { count: 0, total: 0, percentage: 0 };
      }
      breakdown[payment.method].count++;
      breakdown[payment.method].total += amount;
    }

    for (const method in breakdown) {
      breakdown[method].percentage = grandTotal > 0
        ? parseFloat(((breakdown[method].total / grandTotal) * 100).toFixed(1))
        : 0;
    }

    return {
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      summary: {
        totalTransactions: payments.length,
        totalAmount: grandTotal,
        currency: 'KES',
      },
      breakdown,
    };
  }

  async getTermlyCollectionSummary(schoolId: string, termId: string): Promise<any> {
    const term = await this.termRepository.findOne({
      where: { id: termId, schoolId },
      relations: ['academicYear'],
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    const invoices = await this.invoiceRepository.find({
      where: { schoolId, termId },
    });

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        invoiceId: In(invoices.map(i => i.id)),
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalExpected = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.totalAmount)) || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
    const totalOutstanding = totalExpected - totalCollected;

    const statusBreakdown = {
      paid: invoices.filter(i => i.status === InvoiceStatus.PAID).length,
      partiallyPaid: invoices.filter(i => i.status === InvoiceStatus.PARTIALLY_PAID).length,
      unpaid: invoices.filter(i => [InvoiceStatus.DRAFT, InvoiceStatus.SENT].includes(i.status)).length,
      overdue: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      cancelled: invoices.filter(i => i.status === InvoiceStatus.CANCELLED).length,
    };

    return {
      term: {
        id: term.id,
        name: term.name,
        academicYear: term.academicYear?.name,
        startDate: term.startDate,
        endDate: term.endDate,
      },
      summary: {
        totalInvoices: invoices.length,
        totalExpected,
        totalCollected,
        totalOutstanding,
        collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0,
        currency: 'KES',
      },
      statusBreakdown,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * FIX #5: Generate unique invoice number with retry on collision
   */
  private async generateUniqueInvoiceNumber(schoolId: string, maxRetries = 5): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 900000) + 100000;
      const invoiceNumber = `INV-${year}-${random}`;

      const existing = await this.invoiceRepository.findOne({
        where: { schoolId, invoiceNumber },
      });

      if (!existing) {
        return invoiceNumber;
      }
    }

    // Fallback: use timestamp for uniqueness
    const timestamp = Date.now();
    return `INV-${new Date().getFullYear()}-${timestamp}`;
  }

  /**
   * FIX #5: Generate unique receipt number with retry on collision
   */
  private async generateUniqueReceiptNumber(schoolId: string, maxRetries = 5): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 900000) + 100000;
      const receiptNumber = `RCP-${year}-${random}`;

      const existing = await this.paymentRepository.findOne({
        where: { schoolId, receiptNumber },
      });

      if (!existing) {
        return receiptNumber;
      }
    }

    // Fallback: use timestamp for uniqueness
    const timestamp = Date.now();
    return `RCP-${new Date().getFullYear()}-${timestamp}`;
  }

  private calculateDueDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }
}