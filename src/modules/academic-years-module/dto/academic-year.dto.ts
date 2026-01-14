import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AcademicYearStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
}

export class CreateAcademicYearDto {
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

  @ApiPropertyOptional({ example: false, description: 'Is this the current academic year?' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ 
    enum: AcademicYearStatus, 
    default: AcademicYearStatus.UPCOMING,
    description: 'Academic year status' 
  })
  @IsOptional()
  @IsEnum(AcademicYearStatus)
  status?: AcademicYearStatus;
}

export class UpdateAcademicYearDto {
  @ApiPropertyOptional({ example: '2025', description: 'Academic year name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: '2025-01-06', description: 'Year start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-11-28', description: 'Year end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Is this the current academic year?' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ 
    enum: AcademicYearStatus,
    description: 'Academic year status' 
  })
  @IsOptional()
  @IsEnum(AcademicYearStatus)
  status?: AcademicYearStatus;
}