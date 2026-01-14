import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SchoolType {
  PRE_PRIMARY = 'pre-primary',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  MIXED = 'mixed',
}

export enum SubscriptionTier {
  TRIAL = 'trial',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

export class CreateSchoolDto {
  @ApiProperty({ example: 'Ukambani School', description: 'School name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'UKS001', description: 'Unique school code' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must be uppercase alphanumeric' })
  code: string;

  @ApiPropertyOptional({ example: 'ukambani', description: 'Subdomain for school portal' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain must be lowercase alphanumeric with hyphens' })
  subdomain?: string;

  @ApiPropertyOptional({ example: 'ukambani.mwendoschool.com', description: 'Custom domain' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'A leading school in Nairobi...', description: 'School description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'School logo URL' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ example: 'info@ukambanischool.com', description: 'School email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+254700000000', description: 'School phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 School Road', description: 'School address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Nairobi', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Nairobi County', description: 'County' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ example: 'Kenya', description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: SchoolType, default: SchoolType.MIXED, description: 'Type of school' })
  @IsOptional()
  @IsEnum(SchoolType)
  schoolType?: SchoolType;

  @ApiPropertyOptional({ enum: SubscriptionTier, default: SubscriptionTier.TRIAL, description: 'Subscription tier' })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier;

  @ApiPropertyOptional({ example: 500, description: 'Maximum students allowed' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  maxStudents?: number;

  @ApiPropertyOptional({ example: 50, description: 'Maximum teachers allowed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxTeachers?: number;

  @ApiPropertyOptional({ example: '#2563EB', description: 'Primary brand color' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#10B981', description: 'Secondary brand color' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid hex color' })
  secondaryColor?: string;
}