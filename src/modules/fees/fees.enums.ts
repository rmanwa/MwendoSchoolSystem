/**
 * FEES MODULE ENUMS
 * =================
 * Single source of truth for all fee-related enums.
 * Import this file in entities, DTOs, and services.
 */

export enum FeeCategory {
  TUITION = 'tuition',
  BOARDING = 'boarding',
  LUNCH = 'lunch',
  TRANSPORT = 'transport',
  BOOKS_STATIONERY = 'books_stationery',
  UNIFORM = 'uniform',
  EXAMINATION = 'examination',
  LIBRARY = 'library',
  COMPUTER_LAB = 'computer_lab',
  SCIENCE_LAB = 'science_lab',
  SPORTS = 'sports',
  ACTIVITY = 'activity',
  DEVELOPMENT = 'development',
  MAINTENANCE = 'maintenance',
  MEDICAL = 'medical',
  INSURANCE = 'insurance',
  CAUTION = 'caution',
  ADMISSION = 'admission',
  REGISTRATION = 'registration',
  PTA = 'pta',
  TRIP = 'trip',
  GRADUATION = 'graduation',
  CERTIFICATE = 'certificate',
  MEALS = 'meals',
  CLUBS = 'clubs',
  INFRASTRUCTURE = 'infrastructure',
  ELECTRICITY = 'electricity',
  CAPITATION = 'capitation',
  GOK_SUBSIDY = 'gok_subsidy',
  OTHER = 'other',
}

export enum FeeFrequency {
  ONE_TIME = 'one_time',
  PER_TERM = 'per_term',
  PER_YEAR = 'per_year',
  PER_MONTH = 'per_month',
  MONTHLY = 'monthly',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  AIRTEL_MONEY = 'airtel_money',
  T_KASH = 't_kash',
  BANK_TRANSFER = 'bank_transfer',
  BANK_DEPOSIT = 'bank_deposit',
  CHEQUE = 'cheque',
  RTGS = 'rtgs',
  EFT = 'eft',
  CASH = 'cash',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
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

export enum BursarySource {
  NG_CDF = 'ng_cdf',
  COUNTY = 'county',
  PRESIDENTIAL = 'presidential',
  HELB = 'helb',
  CONSTITUENCY = 'constituency',
  CORPORATE = 'corporate',
  NGO = 'ngo',
  RELIGIOUS = 'religious',
  PRIVATE = 'private',
  OTHER = 'other',
}

// Helper to get enum values (works at runtime)
export const getEnumValues = <T extends object>(enumObj: T): string[] => {
  return Object.values(enumObj).filter(value => typeof value === 'string');
};