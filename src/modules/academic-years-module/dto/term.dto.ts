import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TermStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
  BREAK = 'break',
}

export class CreateTermDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000', 
    description: 'Academic Year ID' 
  })
  @IsUUID()
  academicYearId: string;

  @ApiProperty({ example: 'Term 1', description: 'Term name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 1, description: 'Term number (1, 2, or 3)' })
  @IsInt()
  @Min(1)
  @Max(4)
  termNumber: number;

  @ApiProperty({ example: '2025-01-06', description: 'Term start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-04-11', description: 'Term end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: false, description: 'Is this the current term?' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ 
    enum: TermStatus, 
    default: TermStatus.UPCOMING,
    description: 'Term status' 
  })
  @IsOptional()
  @IsEnum(TermStatus)
  status?: TermStatus;

  @ApiPropertyOptional({ example: 14, description: 'Number of weeks in term' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  weeksCount?: number;

  @ApiPropertyOptional({ example: '2025-02-17', description: 'Mid-term break start' })
  @IsOptional()
  @IsDateString()
  midtermBreakStart?: string;

  @ApiPropertyOptional({ example: '2025-02-21', description: 'Mid-term break end' })
  @IsOptional()
  @IsDateString()
  midtermBreakEnd?: string;

  @ApiPropertyOptional({ example: 'First term of 2025', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateTermDto {
  @ApiPropertyOptional({ example: 'Term 1', description: 'Term name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'Term number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  termNumber?: number;

  @ApiPropertyOptional({ example: '2025-01-06', description: 'Term start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-11', description: 'Term end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this the current term?' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ enum: TermStatus, description: 'Term status' })
  @IsOptional()
  @IsEnum(TermStatus)
  status?: TermStatus;

  @ApiPropertyOptional({ example: 14, description: 'Number of weeks' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  weeksCount?: number;

  @ApiPropertyOptional({ example: '2025-02-17', description: 'Mid-term break start' })
  @IsOptional()
  @IsDateString()
  midtermBreakStart?: string;

  @ApiPropertyOptional({ example: '2025-02-21', description: 'Mid-term break end' })
  @IsOptional()
  @IsDateString()
  midtermBreakEnd?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// DTO for creating a full academic year with terms in one request
export class CreateAcademicYearWithTermsDto {
  @ApiProperty({ example: '2025', description: 'Academic year name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '2025-01-06', description: 'Year start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-11-28', description: 'Year end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    type: 'array',
    description: 'Terms to create',
    example: [
      { name: 'Term 1', termNumber: 1, startDate: '2025-01-06', endDate: '2025-04-11', weeksCount: 14 },
      { name: 'Term 2', termNumber: 2, startDate: '2025-05-05', endDate: '2025-08-08', weeksCount: 14 },
      { name: 'Term 3', termNumber: 3, startDate: '2025-09-01', endDate: '2025-11-28', weeksCount: 13 },
    ]
  })
  terms: Omit<CreateTermDto, 'academicYearId'>[];
}