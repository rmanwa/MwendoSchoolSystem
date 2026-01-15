import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums from dedicated file
// NOTE: fees.enums.ts is in parent folder (src/modules/fees/)
// This DTO file is in src/modules/fees/dto/
import {
  FeeCategory,
  FeeFrequency,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '../fees.enums';

// Re-export enums for backward compatibility
export {
  FeeCategory,
  FeeFrequency,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '../fees.enums';

// ==================== FEE STRUCTURE DTOs ====================

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'Tuition Fee', description: 'Name of the fee item' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Term tuition fees', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: FeeCategory, example: FeeCategory.TUITION, description: 'Fee category/vote head' })
  @IsEnum(FeeCategory)
  category: FeeCategory;

  @ApiProperty({ example: 15000, description: 'Amount in KES' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: FeeFrequency, example: FeeFrequency.PER_TERM, description: 'Payment frequency' })
  @IsEnum(FeeFrequency)
  frequency: FeeFrequency;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Specific Class ID (null = all classes)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Minimum grade level' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  minGradeLevel?: number;

  @ApiPropertyOptional({ example: 6, description: 'Maximum grade level' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  maxGradeLevel?: number;

  @ApiPropertyOptional({ example: true, description: 'Applies to boarders?' })
  @IsOptional()
  @IsBoolean()
  forBoarders?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Applies to day scholars?' })
  @IsOptional()
  @IsBoolean()
  forDayScholars?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Is this fee mandatory?' })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is this a government fee?' })
  @IsOptional()
  @IsBoolean()
  isGovernmentFee?: boolean;

  @ApiPropertyOptional({ example: 14, description: 'Due days from term start' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dueDaysFromTermStart?: number;
}

export class UpdateFeeStructureDto {
  @ApiPropertyOptional({ example: 'Updated Tuition Fee' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: FeeCategory })
  @IsOptional()
  @IsEnum(FeeCategory)
  category?: FeeCategory;

  @ApiPropertyOptional({ example: 18000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: FeeFrequency })
  @IsOptional()
  @IsEnum(FeeFrequency)
  frequency?: FeeFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forBoarders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forDayScholars?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dueDaysFromTermStart?: number;
}

export class FeeStructureQueryDto {
  @ApiPropertyOptional({ enum: FeeCategory })
  @IsOptional()
  @IsEnum(FeeCategory)
  category?: FeeCategory;

  @ApiPropertyOptional({ enum: FeeFrequency })
  @IsOptional()
  @IsEnum(FeeFrequency)
  frequency?: FeeFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  forBoarders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PublicSchoolFeeTemplateDto {
  @ApiProperty({
    enum: ['national', 'extra_county_a', 'extra_county_b', 'county', 'sub_county', 'special_needs'],
    example: 'national',
    description: 'School category for fee template',
  })
  @IsString()
  schoolCategory: string;

  @ApiProperty({
    enum: ['day', 'boarding'],
    example: 'boarding',
    description: 'School type',
  })
  @IsString()
  schoolType: string;

  @ApiProperty({ description: 'Academic Year ID' })
  @IsUUID()
  academicYearId: string;
}

// ==================== INVOICE DTOs ====================

export class InvoiceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  feeStructureId?: string;

  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'tuition' })
  @IsString()
  category: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ description: 'Custom invoice items (auto-generated if empty)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Discount amount in KES' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'Sibling discount' })
  @IsOptional()
  @IsString()
  discountReason?: string;

  @ApiPropertyOptional({ example: 0, description: 'Bursary amount in KES' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bursaryAmount?: number;

  @ApiPropertyOptional({ description: 'Issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkInvoiceGenerationDto {
  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: 'Academic Year ID' })
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class InvoiceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class FeeStatementRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

// ==================== PAYMENT DTOs ====================

export class CreatePaymentDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: 'Invoice ID (optional)' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ example: 15000, description: 'Amount in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.MPESA })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'QKJ3M7YT8R' })
  @IsOptional()
  @IsString()
  mpesaReceiptNumber?: string;

  @ApiPropertyOptional({ example: '254712345678' })
  @IsOptional()
  @IsString()
  mpesaPhoneNumber?: string;

  @ApiPropertyOptional({ example: 'Kenya Commercial Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Westlands Branch' })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'CHQ001234' })
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional({ example: '254712345678' })
  @IsOptional()
  @IsString()
  payerPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  payerEmail?: string;

  @ApiPropertyOptional({ example: 'Term 1 fees payment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Vote head allocation' })
  @IsOptional()
  @IsArray()
  voteAllocation?: any[];
}

export class ReversePaymentDto {
  @ApiProperty({ example: 'Duplicate payment' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PaymentReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

// ==================== BURSARY DTOs ====================

export class ApplyBursaryDto {
  @ApiProperty({ example: 10000, description: 'Bursary amount in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'NG-CDF', description: 'Bursary source' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'CDF/2024/001234', description: 'Bursary reference number' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({ example: 'Starehe Constituency' })
  @IsOptional()
  @IsString()
  constituency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==================== M-PESA STK PUSH DTO ====================

export class MpesaSTKPushDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 15000, description: 'Amount in KES' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '254712345678', description: 'Phone number (254...)' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}

// ==================== REPORT DTOs ====================

export class DefaultersQueryDto {
  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ description: 'Minimum balance threshold' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBalance?: number;
}

export class DailyReportDto {
  @ApiProperty({ example: '2025-01-15', description: 'Date in YYYY-MM-DD format' })
  @IsString()
  date: string;
}

export class DateRangeReportDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start date in YYYY-MM-DD format' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31', description: 'End date in YYYY-MM-DD format' })
  @IsDateString()
  endDate: string;
}