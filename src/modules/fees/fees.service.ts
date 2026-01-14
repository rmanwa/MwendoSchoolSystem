import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In, Not } from 'typeorm';

// Import enums from DTOs (single source during development)
import {
  FeeCategory,
  FeeFrequency,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from './dto/fees.dto';

// Forward declarations for entities (will be properly imported when entities are in place)
// These imports will work once you copy the entity files to src/database/entities/
import { FeeStructure } from '../../database/entities/fee-structure.entity';
import { FeeInvoice } from '../../database/entities/fee-invoice.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Student } from '../../database/entities/student.entity';
import { Class } from '../../database/entities/class.entity';
import { Term } from '../../database/entities/term.entity';
import { AcademicYear } from '../../database/entities/academic-year.entity';

// ============================================
// KENYA SCHOOL FEE TEMPLATES (2024/2025)
// Based on Ministry of Education Guidelines
// ============================================

// Government Capitation per student per year (KES)
export const GOK_CAPITATION = {
  SECONDARY_DAY: 22244,        // Free Day Secondary Education (FDSE)
  SECONDARY_BOARDING: 22244,   // Same capitation for boarding
  PRIMARY: 1420,               // Free Primary Education (FPE)
  SPECIAL_NEEDS: 53807,        // Enhanced for special needs schools
  JUNIOR_SECONDARY: 15043,     // Junior Secondary (Grade 7-9)
};

// Capitation disbursement ratio per term
export const CAPITATION_DISBURSEMENT = {
  TERM_1: 0.5,   // 50%
  TERM_2: 0.3,   // 30%
  TERM_3: 0.2,   // 20%
};

// Vote head interface
export interface VoteHead {
  category: string;
  name: string;
  amount: number;
  isGovt: boolean;
  optional?: boolean;
}

// Template interface
export interface FeeTemplate {
  name: string;
  category: string;
  type: string;
  totalAnnual: number;
  gokSubsidy: number;
  parentPays: number;
  voteHeads: VoteHead[];
}

// Public Secondary School Fee Templates (Annual - KES)
export const PUBLIC_SCHOOL_FEE_TEMPLATES: Record<string, FeeTemplate> = {
  // Category A: National & Extra-County in major towns
  national_boarding: {
    name: 'National School (Boarding)',
    category: 'national',
    type: 'boarding',
    totalAnnual: 75798,
    gokSubsidy: 22244,
    parentPays: 53554,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Quality Assurance (GOK)', amount: 1077, isGovt: true },
      { category: 'other', name: 'SMASSE (GOK)', amount: 600, isGovt: true },
      { category: 'other', name: 'ICT (GOK)', amount: 2400, isGovt: true },
      { category: 'boarding', name: 'Boarding Fee', amount: 40535, isGovt: false },
      { category: 'maintenance', name: 'M&I (Parent)', amount: 7000, isGovt: false },
      { category: 'activity', name: 'Activity Fee (Parent)', amount: 3000, isGovt: false },
      { category: 'medical', name: 'Medical & Insurance', amount: 2000, isGovt: false },
      { category: 'other', name: 'Other Vote Heads', amount: 1019, isGovt: false },
    ],
  },

  extra_county_a_boarding: {
    name: 'Extra County Category A (Boarding)',
    category: 'extra_county',
    type: 'boarding',
    totalAnnual: 75798,
    gokSubsidy: 22244,
    parentPays: 53554,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 4077, isGovt: true },
      { category: 'boarding', name: 'Boarding Fee', amount: 40535, isGovt: false },
      { category: 'maintenance', name: 'M&I (Parent)', amount: 7000, isGovt: false },
      { category: 'activity', name: 'Activity Fee (Parent)', amount: 3000, isGovt: false },
      { category: 'medical', name: 'Medical & Insurance', amount: 2000, isGovt: false },
      { category: 'other', name: 'Other Vote Heads', amount: 1019, isGovt: false },
    ],
  },

  extra_county_b_boarding: {
    name: 'Extra County Category B (Boarding)',
    category: 'extra_county',
    type: 'boarding',
    totalAnnual: 62779,
    gokSubsidy: 22244,
    parentPays: 40535,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 4077, isGovt: true },
      { category: 'boarding', name: 'Boarding Fee', amount: 28000, isGovt: false },
      { category: 'maintenance', name: 'M&I (Parent)', amount: 7000, isGovt: false },
      { category: 'activity', name: 'Activity Fee (Parent)', amount: 2500, isGovt: false },
      { category: 'medical', name: 'Medical & Insurance', amount: 2000, isGovt: false },
      { category: 'other', name: 'Other Vote Heads', amount: 1035, isGovt: false },
    ],
  },

  county_boarding: {
    name: 'County School (Boarding)',
    category: 'county',
    type: 'boarding',
    totalAnnual: 55000,
    gokSubsidy: 22244,
    parentPays: 32756,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 4077, isGovt: true },
      { category: 'boarding', name: 'Boarding Fee', amount: 22000, isGovt: false },
      { category: 'maintenance', name: 'M&I (Parent)', amount: 5000, isGovt: false },
      { category: 'activity', name: 'Activity Fee (Parent)', amount: 2500, isGovt: false },
      { category: 'medical', name: 'Medical & Insurance', amount: 2000, isGovt: false },
      { category: 'other', name: 'Other Vote Heads', amount: 1256, isGovt: false },
    ],
  },

  sub_county_boarding: {
    name: 'Sub-County School (Boarding)',
    category: 'sub_county',
    type: 'boarding',
    totalAnnual: 45000,
    gokSubsidy: 22244,
    parentPays: 22756,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 4077, isGovt: true },
      { category: 'boarding', name: 'Boarding Fee', amount: 15000, isGovt: false },
      { category: 'maintenance', name: 'M&I (Parent)', amount: 4000, isGovt: false },
      { category: 'activity', name: 'Activity Fee (Parent)', amount: 2000, isGovt: false },
      { category: 'medical', name: 'Medical & Insurance', amount: 1500, isGovt: false },
      { category: 'other', name: 'Other Vote Heads', amount: 256, isGovt: false },
    ],
  },

  day_school: {
    name: 'Day School',
    category: 'day',
    type: 'day',
    totalAnnual: 22244,
    gokSubsidy: 22244,
    parentPays: 0,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1815, isGovt: true },
      { category: 'maintenance', name: 'Repair/Maintenance (GOK)', amount: 4001, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 4077, isGovt: true },
      { category: 'lunch', name: 'Lunch (Optional)', amount: 5000, isGovt: false, optional: true },
    ],
  },

  special_needs_boarding: {
    name: 'Special Needs School (Boarding)',
    category: 'special_needs',
    type: 'boarding',
    totalAnnual: 53807,
    gokSubsidy: 53807,
    parentPays: 0,
    voteHeads: [
      { category: 'tuition', name: 'Tuition (GOK)', amount: 5446, isGovt: true },
      { category: 'books_stationery', name: 'Books & Stationery (GOK)', amount: 3814, isGovt: true },
      { category: 'examination', name: 'Examination (GOK)', amount: 3091, isGovt: true },
      { category: 'boarding', name: 'Boarding Equipment (GOK)', amount: 19053, isGovt: true },
      { category: 'activity', name: 'Activity Fee (GOK)', amount: 1500, isGovt: true },
      { category: 'medical', name: 'Medical & Insurance (GOK)', amount: 2000, isGovt: true },
      { category: 'other', name: 'Top Up - Assistive Devices (GOK)', amount: 12510, isGovt: true },
      { category: 'other', name: 'Other GOK', amount: 6393, isGovt: true },
    ],
  },
};

// Kenya Banks commonly used for school fees
export const KENYA_BANKS = [
  { code: 'KCB', name: 'Kenya Commercial Bank', paybill: '522522', schoolPaybill: '522123' },
  { code: 'EQUITY', name: 'Equity Bank', paybill: '247247' },
  { code: 'COOP', name: 'Cooperative Bank', paybill: '400200' },
  { code: 'NBK', name: 'National Bank of Kenya', paybill: '625625' },
  { code: 'STANBIC', name: 'Stanbic Bank', paybill: '600100' },
  { code: 'ABSA', name: 'Absa Bank Kenya', paybill: '303030' },
  { code: 'DTB', name: 'Diamond Trust Bank', paybill: '516600' },
  { code: 'NCBA', name: 'NCBA Bank', paybill: '880100' },
  { code: 'FAMILY', name: 'Family Bank', paybill: '222111' },
  { code: 'IM', name: 'I&M Bank', paybill: '542542' },
];

// Private school fee ranges
export const PRIVATE_SCHOOL_FEE_RANGES = {
  budget: {
    name: 'Budget Private School',
    annualRange: { min: 30000, max: 80000 },
    perTerm: { min: 10000, max: 27000 },
  },
  mid_range: {
    name: 'Mid-Range Private School',
    annualRange: { min: 80000, max: 300000 },
    perTerm: { min: 27000, max: 100000 },
  },
  premium: {
    name: 'Premium Private School',
    annualRange: { min: 300000, max: 1000000 },
    perTerm: { min: 100000, max: 350000 },
    examples: ['Brookhouse', 'Peponi', 'Banda School', 'Hillcrest'],
  },
  international: {
    name: 'International School',
    annualRange: { min: 1000000, max: 4500000 },
    perTerm: { min: 350000, max: 1500000 },
    examples: ['ISK', 'IAIA', 'Rosslyn Academy', 'Braeburn'],
    additionalFees: {
      admission: { min: 50000, max: 1300000 },
      caution: { min: 40000, max: 100000 },
      capital_levy: { min: 0, max: 1300000 },
    },
  },
};

// Discount types
export const DISCOUNT_TYPES = {
  SIBLING: {
    name: 'Sibling Discount',
    rates: {
      second_child: 0.10,
      third_child: 0.15,
      fourth_plus: 0.20,
    },
  },
  STAFF: {
    name: 'Staff Children',
    rate: 0.25,
  },
  EARLY_PAYMENT: {
    name: 'Early Payment Discount',
    rate: 0.05,
  },
  FULL_YEAR: {
    name: 'Full Year Payment',
    rate: 0.10,
  },
};

// Bursary types in Kenya
export const BURSARY_TYPES = [
  { code: 'NG_CDF', name: 'National Government CDF Bursary' },
  { code: 'COUNTY', name: 'County Government Bursary' },
  { code: 'PSSB', name: 'Presidential Secondary School Bursary' },
  { code: 'HELB', name: 'Higher Education Loans Board' },
  { code: 'CONSTITUENCY', name: 'Constituency Bursary' },
  { code: 'CORPORATE', name: 'Corporate Scholarship' },
  { code: 'NGO', name: 'NGO Scholarship' },
  { code: 'RELIGIOUS', name: 'Religious Organization' },
  { code: 'PRIVATE', name: 'Private Sponsor' },
];

// Error result interface
export interface BulkError {
  studentId: string;
  name: string;
  error: string;
}

// Bulk generation result interface
export interface BulkGenerationResult {
  total: number;
  created: number;
  skipped: number;
  errors: BulkError[];
}

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
  ) {}

  // ============================================
  // REFERENCE DATA & TEMPLATES
  // ============================================

  getPublicSchoolFeeTemplates() {
    return {
      templates: PUBLIC_SCHOOL_FEE_TEMPLATES,
      capitation: GOK_CAPITATION,
      disbursementRatio: CAPITATION_DISBURSEMENT,
      notes: [
        'Day schools are FREE - only optional lunch fees',
        'Government provides KES 22,244 per student per year for secondary',
        'Capitation disbursed in ratio 50:30:20 across terms',
        'Boarding fees vary by school category and location',
        'Category A: National & Extra-County in Nairobi, Mombasa, Nakuru, Kisumu, Nyeri, Thika, Eldoret',
        'Category B: All other boarding schools',
        'Schools cannot send students home for non-payment (Basic Education Act)',
      ],
    };
  }

  getPrivateSchoolFeeRanges() {
    return {
      ranges: PRIVATE_SCHOOL_FEE_RANGES,
      notes: [
        'Private schools set their own fees',
        'Fees must be approved by school board',
        'International schools often charge in USD',
        'Additional fees may include: admission, caution, transport, uniform',
        'Payment plans/installments commonly available',
      ],
    };
  }

  getKenyaBanks() {
    return KENYA_BANKS;
  }

  getBursaryTypes() {
    return BURSARY_TYPES;
  }

  getDiscountTypes() {
    return DISCOUNT_TYPES;
  }

  getFeeCategories() {
    return Object.values(FeeCategory).map(cat => ({
      value: cat,
      label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }

  // ============================================
  // FEE STRUCTURE MANAGEMENT
  // ============================================

  async createFeeStructure(schoolId: string, dto: Partial<FeeStructure>, createdBy: string): Promise<FeeStructure> {
    const feeStructure = this.feeStructureRepository.create({
      ...dto,
      schoolId,
      createdBy,
    });

    return this.feeStructureRepository.save(feeStructure);
  }

  async createFromTemplate(
    schoolId: string,
    templateKey: string,
    academicYearId: string,
    createdBy: string,
  ): Promise<FeeStructure[]> {
    const template = PUBLIC_SCHOOL_FEE_TEMPLATES[templateKey];
    if (!template) {
      throw new BadRequestException(`Invalid template: ${templateKey}. Available: ${Object.keys(PUBLIC_SCHOOL_FEE_TEMPLATES).join(', ')}`);
    }

    const feeStructures: FeeStructure[] = [];

    for (const voteHead of template.voteHeads) {
      const feeStructure = this.feeStructureRepository.create({
        schoolId,
        name: voteHead.name,
        category: voteHead.category as FeeCategory,
        amount: voteHead.amount,
        frequency: FeeFrequency.PER_YEAR,
        academicYearId,
        isGovernmentFee: voteHead.isGovt,
        isMandatory: !voteHead.optional,
        forBoarders: template.type === 'boarding',
        forDayScholars: template.type === 'day' || !template.type,
        createdBy,
      });

      feeStructures.push(feeStructure);
    }

    return this.feeStructureRepository.save(feeStructures);
  }

  async findAllFeeStructures(schoolId: string, query: any) {
    const where: any = { schoolId, isActive: true };

    if (query.category) where.category = query.category;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.classId) where.classId = query.classId;
    if (query.forBoarders !== undefined) where.forBoarders = query.forBoarders;

    const feeStructures = await this.feeStructureRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });

    const govtTotal = feeStructures
      .filter(f => f.isGovernmentFee)
      .reduce((sum, f) => sum + Number(f.amount), 0);
    
    const parentTotal = feeStructures
      .filter(f => !f.isGovernmentFee)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      feeStructures,
      summary: {
        totalItems: feeStructures.length,
        governmentSubsidy: govtTotal,
        parentPayable: parentTotal,
        grandTotal: govtTotal + parentTotal,
        currency: 'KES',
      },
    };
  }

  async updateFeeStructure(schoolId: string, id: string, dto: Partial<FeeStructure>): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    Object.assign(feeStructure, dto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async removeFeeStructure(schoolId: string, id: string) {
    const result = await this.feeStructureRepository.delete({ id, schoolId });
    if (result.affected === 0) {
      throw new NotFoundException('Fee structure not found');
    }
    return { deleted: true };
  }

  // ============================================
  // INVOICE MANAGEMENT
  // ============================================

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `INV-${year}-${random}`;
  }

  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RCP-${year}-${random}`;
  }

  private calculateDueDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

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
      if ((student as any).isBoarder && fee.forBoarders) return true;
      if (!(student as any).isBoarder && fee.forDayScholars) return true;
      if (!fee.forBoarders && !fee.forDayScholars) return true;
      return false;
    });

    let items = dto.items || [];
    if (items.length === 0) {
      items = applicableFees.map(fee => ({
        feeStructureId: fee.id,
        name: fee.name,
        category: fee.category,
        amount: fee.amount,
        quantity: 1,
        total: fee.amount,
        isGovernmentFee: fee.isGovernmentFee,
      }));
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || item.amount * (item.quantity || 1)), 0);
    const governmentSubsidy = items
      .filter((item: any) => item.isGovernmentFee)
      .reduce((sum: number, item: any) => sum + (item.total || item.amount), 0);
    const discountAmount = dto.discountAmount || 0;
    const bursaryAmount = dto.bursaryAmount || 0;
    const totalAmount = subtotal - governmentSubsidy - discountAmount - bursaryAmount;

    const invoice = this.invoiceRepository.create({
      schoolId,
      invoiceNumber: this.generateInvoiceNumber(),
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

  async bulkGenerateInvoices(schoolId: string, dto: any, createdBy: string): Promise<BulkGenerationResult> {
    const students = await this.studentRepository.find({
      where: { classId: dto.classId, schoolId },
      relations: ['user'],
    });

    if (students.length === 0) {
      throw new NotFoundException('No students found in class');
    }

    const results: BulkGenerationResult = {
      total: students.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const student of students) {
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

      try {
        await this.createInvoice(schoolId, {
          studentId: student.id,
          termId: dto.termId,
          academicYearId: dto.academicYearId,
          dueDate: dto.dueDate,
        }, createdBy);
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

  async findAllInvoices(schoolId: string, query: any) {
    const where: any = { schoolId };

    if (query.studentId) where.studentId = query.studentId;
    if (query.termId) where.termId = query.termId;
    if (query.status) where.status = query.status;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    if (query.overdueOnly) {
      where.status = In([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID]);
      where.dueDate = LessThanOrEqual(new Date());
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where,
      relations: ['student', 'term'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    for (const invoice of invoices) {
      if (
        new Date(invoice.dueDate) < new Date() &&
        invoice.status !== InvoiceStatus.PAID &&
        invoice.status !== InvoiceStatus.CANCELLED
      ) {
        invoice.status = InvoiceStatus.OVERDUE;
        await this.invoiceRepository.save(invoice);
      }
    }

    return {
      data: invoices,
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
      relations: ['student', 'term', 'academicYear', 'payments'],
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

    if (Number(invoice.amountPaid) > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments. Refund payments first.');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    return this.invoiceRepository.save(invoice);
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  async createPayment(schoolId: string, dto: any, recordedBy: string): Promise<Payment> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, schoolId },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let invoice: FeeInvoice | null = null;
    if (dto.invoiceId) {
      invoice = await this.invoiceRepository.findOne({
        where: { id: dto.invoiceId, schoolId, studentId: dto.studentId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Invoice is already fully paid');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay cancelled invoice');
      }
    }

    const payment = this.paymentRepository.create({
      schoolId,
      receiptNumber: this.generateReceiptNumber(),
      studentId: dto.studentId,
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      method: dto.method,
      status: PaymentStatus.COMPLETED,
      paymentDate: dto.paymentDate || new Date(),
      transactionReference: dto.transactionReference,
      mpesaReceiptNumber: dto.mpesaReceiptNumber,
      mpesaPhoneNumber: dto.mpesaPhoneNumber,
      bankName: dto.bankName,
      bankBranch: dto.bankBranch,
      bankAccount: dto.bankAccount,
      chequeNumber: dto.chequeNumber,
      chequeDate: dto.chequeDate,
      payerName: dto.payerName,
      payerPhone: dto.payerPhone,
      payerEmail: dto.payerEmail,
      description: dto.description,
      voteAllocation: dto.voteAllocation,
      recordedBy,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    if (invoice) {
      invoice.amountPaid = Number(invoice.amountPaid) + Number(dto.amount);
      invoice.balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);

      if (invoice.balance <= 0) {
        invoice.status = InvoiceStatus.PAID;
        invoice.balance = 0;
      } else {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }

      await this.invoiceRepository.save(invoice);

      savedPayment.balanceAfter = invoice.balance;
      await this.paymentRepository.save(savedPayment);
    }

    return savedPayment;
  }

  async recordMpesaPayment(schoolId: string, dto: any, recordedBy: string): Promise<Payment> {
    return this.createPayment(schoolId, {
      ...dto,
      method: PaymentMethod.MPESA,
      transactionReference: dto.mpesaReceiptNumber,
    }, recordedBy);
  }

  async findAllPayments(schoolId: string, query: any) {
    const where: any = { schoolId };

    if (query.studentId) where.studentId = query.studentId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;

    if (query.fromDate && query.toDate) {
      where.paymentDate = Between(new Date(query.fromDate), new Date(query.toDate));
    } else if (query.fromDate) {
      where.paymentDate = MoreThanOrEqual(new Date(query.fromDate));
    } else if (query.toDate) {
      where.paymentDate = LessThanOrEqual(new Date(query.toDate));
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['student', 'invoice'],
      order: { paymentDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payments,
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
      relations: ['student', 'invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async reversePayment(schoolId: string, id: string, dto: any, reversedBy: string): Promise<Payment> {
    const payment = await this.findOnePayment(schoolId, id);

    if (payment.status === PaymentStatus.REVERSED) {
      throw new BadRequestException('Payment is already reversed');
    }

    payment.status = PaymentStatus.REVERSED;
    payment.reversedBy = reversedBy;
    payment.reversalDate = new Date();
    payment.reversalReason = dto.reason;

    await this.paymentRepository.save(payment);

    if (payment.invoiceId) {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: payment.invoiceId },
      });

      if (invoice) {
        invoice.amountPaid = Number(invoice.amountPaid) - Number(payment.amount);
        invoice.balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);

        if (invoice.amountPaid <= 0) {
          invoice.status = InvoiceStatus.SENT;
          invoice.amountPaid = 0;
        } else {
          invoice.status = InvoiceStatus.PARTIALLY_PAID;
        }

        await this.invoiceRepository.save(invoice);
      }
    }

    return payment;
  }

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================

  async getStudentFeeStatement(schoolId: string, studentId: string, query: any) {
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
      relations: ['term'],
      order: { issueDate: 'ASC' },
    });

    const paymentWhere: any = { schoolId, studentId, status: PaymentStatus.COMPLETED };
    if (query.fromDate && query.toDate) {
      paymentWhere.paymentDate = Between(new Date(query.fromDate), new Date(query.toDate));
    }

    const payments = await this.paymentRepository.find({
      where: paymentWhere,
      order: { paymentDate: 'ASC' },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalBalance = totalBilled - totalPaid;

    return {
      student: {
        id: student.id,
        admissionNumber: (student as any).admissionNumber,
        name: `${(student as any).user?.firstName || ''} ${(student as any).user?.lastName || ''}`.trim(),
        class: (student as any).class?.name,
      },
      invoices,
      payments,
      summary: {
        totalBilled,
        totalPaid,
        totalBalance,
        status: totalBalance <= 0 ? 'CLEARED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
        currency: 'KES',
      },
    };
  }

  async getClassFeesSummary(schoolId: string, classId: string, termId?: string) {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const students = await this.studentRepository.find({
      where: { classId, schoolId },
      relations: ['user'],
    });

    const studentIds = students.map(s => s.id);

    const invoiceWhere: any = { schoolId, studentId: In(studentIds) };
    if (termId) invoiceWhere.termId = termId;

    const invoices = await this.invoiceRepository.find({ where: invoiceWhere });

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        studentId: In(studentIds),
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalExpected = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalCollected = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalOutstanding = totalExpected - totalCollected;

    const studentBreakdown = students.map(student => {
      const studentInvoices = invoices.filter(inv => inv.studentId === student.id);
      const studentPayments = payments.filter(pay => pay.studentId === student.id);

      const billed = studentInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const paid = studentPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);

      return {
        studentId: student.id,
        admissionNumber: (student as any).admissionNumber,
        name: `${(student as any).user?.firstName || ''} ${(student as any).user?.lastName || ''}`.trim(),
        billed,
        paid,
        balance: billed - paid,
        status: billed - paid <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      };
    });

    const paidCount = studentBreakdown.filter(s => s.status === 'paid').length;
    const partialCount = studentBreakdown.filter(s => s.status === 'partial').length;
    const unpaidCount = studentBreakdown.filter(s => s.status === 'unpaid').length;

    return {
      class: {
        id: classEntity.id,
        name: classEntity.name,
      },
      summary: {
        totalStudents: students.length,
        totalExpected,
        totalCollected,
        totalOutstanding,
        collectionRate: totalExpected > 0 
          ? ((totalCollected / totalExpected) * 100).toFixed(1) + '%' 
          : '0%',
        paidStudents: paidCount,
        partialStudents: partialCount,
        unpaidStudents: unpaidCount,
        currency: 'KES',
      },
      students: studentBreakdown.sort((a, b) => b.balance - a.balance),
    };
  }

  async getPaymentMethodsBreakdown(schoolId: string, query: any) {
    const where: any = { schoolId, status: PaymentStatus.COMPLETED };

    if (query.fromDate && query.toDate) {
      where.paymentDate = Between(new Date(query.fromDate), new Date(query.toDate));
    }

    const payments = await this.paymentRepository.find({ where });

    const breakdown: Record<string, { count: number; total: number; percentage: string }> = {};
    for (const method of Object.values(PaymentMethod)) {
      const methodPayments = payments.filter(p => p.method === method);
      if (methodPayments.length > 0) {
        breakdown[method] = {
          count: methodPayments.length,
          total: methodPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          percentage: '0%',
        };
      }
    }

    const grandTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    for (const method in breakdown) {
      breakdown[method].percentage = grandTotal > 0
        ? ((breakdown[method].total / grandTotal) * 100).toFixed(1) + '%'
        : '0%';
    }

    return {
      breakdown,
      grandTotal,
      totalTransactions: payments.length,
      currency: 'KES',
      period: {
        from: query.fromDate,
        to: query.toDate,
      },
    };
  }

  async getDefaultersList(schoolId: string, query: any) {
    const invoices = await this.invoiceRepository.find({
      where: {
        schoolId,
        status: In([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
      },
      relations: ['student'],
    });

    const studentBalances: Record<string, any> = {};
    for (const invoice of invoices) {
      const studentId = invoice.studentId;
      if (!studentBalances[studentId]) {
        studentBalances[studentId] = {
          student: invoice.student,
          totalBilled: 0,
          totalPaid: 0,
          balance: 0,
          invoices: [],
        };
      }
      studentBalances[studentId].totalBilled += Number(invoice.totalAmount);
      studentBalances[studentId].totalPaid += Number(invoice.amountPaid);
      studentBalances[studentId].balance += Number(invoice.balance);
      studentBalances[studentId].invoices.push(invoice);
    }

    let defaulters = Object.values(studentBalances)
      .filter((d: any) => d.balance > 0)
      .map((d: any) => ({
        studentId: d.student?.id,
        admissionNumber: d.student?.admissionNumber,
        name: `${d.student?.user?.firstName || ''} ${d.student?.user?.lastName || ''}`.trim(),
        class: d.student?.class?.name,
        classId: d.student?.class?.id,
        totalBilled: d.totalBilled,
        totalPaid: d.totalPaid,
        balance: d.balance,
        invoiceCount: d.invoices.length,
        isOverdue: d.invoices.some((i: FeeInvoice) => i.status === InvoiceStatus.OVERDUE),
      }))
      .sort((a, b) => b.balance - a.balance);

    if (query.classId) {
      defaulters = defaulters.filter(d => d.classId === query.classId);
    }

    if (query.minBalance) {
      defaulters = defaulters.filter(d => d.balance >= Number(query.minBalance));
    }

    return {
      defaulters,
      summary: {
        totalDefaulters: defaulters.length,
        totalOutstanding: defaulters.reduce((sum, d) => sum + d.balance, 0),
        overdueCount: defaulters.filter(d => d.isOverdue).length,
        currency: 'KES',
      },
    };
  }

  async getDailyCollectionReport(schoolId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await this.paymentRepository.find({
      where: {
        schoolId,
        paymentDate: Between(startOfDay, endOfDay),
        status: PaymentStatus.COMPLETED,
      },
      relations: ['student'],
      order: { paymentDate: 'ASC' },
    });

    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const payment of payments) {
      if (!byMethod[payment.method]) {
        byMethod[payment.method] = { count: 0, total: 0 };
      }
      byMethod[payment.method].count++;
      byMethod[payment.method].total += Number(payment.amount);
    }

    return {
      date,
      payments: payments.map(p => ({
        receiptNumber: p.receiptNumber,
        time: p.paymentDate,
        student: `${(p.student as any)?.user?.firstName || ''} ${(p.student as any)?.user?.lastName || ''}`.trim(),
        admissionNumber: (p.student as any)?.admissionNumber,
        amount: p.amount,
        method: p.method,
        reference: p.transactionReference || p.mpesaReceiptNumber || p.chequeNumber,
        recordedBy: p.recordedBy,
      })),
      summary: {
        totalTransactions: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        byMethod,
        currency: 'KES',
      },
    };
  }

  async getTermlyCollectionSummary(schoolId: string, termId: string) {
    const term = await this.termRepository.findOne({
      where: { id: termId },
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    const invoices = await this.invoiceRepository.find({
      where: { schoolId, termId },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

    return {
      term: {
        id: term.id,
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
      },
      summary: {
        totalInvoices: invoices.length,
        totalBilled,
        totalCollected,
        totalOutstanding: totalBilled - totalCollected,
        collectionRate: totalBilled > 0 
          ? ((totalCollected / totalBilled) * 100).toFixed(1) + '%' 
          : '0%',
        fullyPaid: invoices.filter(i => i.status === InvoiceStatus.PAID).length,
        partiallyPaid: invoices.filter(i => i.status === InvoiceStatus.PARTIALLY_PAID).length,
        unpaid: invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.DRAFT).length,
        overdue: invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
        currency: 'KES',
      },
    };
  }

  async applyBursary(schoolId: string, invoiceId: string, dto: any, recordedBy: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, schoolId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    invoice.bursaryAmount = Number(invoice.bursaryAmount || 0) + Number(dto.amount);
    invoice.totalAmount = Number(invoice.subtotal) - Number(invoice.discountAmount) - Number(invoice.governmentSubsidy) - Number(invoice.bursaryAmount) + Number(invoice.latePenalty || 0);
    invoice.balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);

    const bursaryPayment = this.paymentRepository.create({
      schoolId,
      receiptNumber: this.generateReceiptNumber(),
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      amount: dto.amount,
      method: PaymentMethod.BURSARY,
      status: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
      bursarySource: dto.source,
      bursaryReference: dto.reference,
      description: `${dto.source} Bursary - Ref: ${dto.reference}`,
      recordedBy,
    });

    await this.paymentRepository.save(bursaryPayment);
    await this.invoiceRepository.save(invoice);

    return { invoice, bursaryPayment };
  }
}