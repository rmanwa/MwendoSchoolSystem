// Fees Module exports
export { FeesModule } from './fees.module';
export { FeesService } from './fees.service';
export { FeesController } from './fees.controller';

// DTOs
export {
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  FeeStructureQueryDto,
  PublicSchoolFeeTemplateDto,
  CreateInvoiceDto,
  BulkInvoiceGenerationDto,
  InvoiceQueryDto,
  FeeStatementRequestDto,
  CreatePaymentDto,
  ReversePaymentDto,
  PaymentQueryDto,
  PaymentReportDto,
  MpesaSTKPushDto,
  ApplyBursaryDto,
  // Enums from DTOs
  FeeCategory,
  FeeFrequency,
  PaymentMethod,
  PaymentStatus,
  InvoiceStatus,
} from './dto/fees.dto';

// Kenya-specific constants
export {
  GOK_CAPITATION,
  CAPITATION_DISBURSEMENT,
  PUBLIC_SCHOOL_FEE_TEMPLATES,
  KENYA_BANKS,
  PRIVATE_SCHOOL_FEE_RANGES,
  DISCOUNT_TYPES,
  BURSARY_TYPES,
} from './fees.service';

// Type-only exports for interfaces
export type {
  VoteHead,
  FeeTemplate,
  BulkError,
  BulkGenerationResult,
} from './fees.service';