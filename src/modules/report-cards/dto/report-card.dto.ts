import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ReportCardStatus } from '../../../database/entities/report-card.entity';

/**
 * REPORT CARDS DTOs
 * =================
 * Data Transfer Objects for report card operations
 */

export class GenerateReportCardDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiPropertyOptional({ description: 'Curriculum (8-4-4, CBC, CAMBRIDGE)', default: '8-4-4' })
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiPropertyOptional({ description: 'Include fee balance on report card', default: false })
  @IsOptional()
  @IsBoolean()
  includeFeeBalance?: boolean;

  @ApiPropertyOptional({ description: 'Regenerate if exists', default: false })
  @IsOptional()
  @IsBoolean()
  regenerate?: boolean;
}

export class BulkGenerateReportCardsDto {
  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiPropertyOptional({ description: 'Curriculum (8-4-4, CBC, CAMBRIDGE)', default: '8-4-4' })
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiPropertyOptional({ description: 'Include fee balance on report cards', default: false })
  @IsOptional()
  @IsBoolean()
  includeFeeBalance?: boolean;

  @ApiPropertyOptional({ description: 'Regenerate existing report cards', default: false })
  @IsOptional()
  @IsBoolean()
  regenerate?: boolean;
}

export class UpdateReportCardCommentsDto {
  @ApiPropertyOptional({ description: "Class teacher's comment" })
  @IsOptional()
  @IsString()
  classTeacherComment?: string;

  @ApiPropertyOptional({ description: "Principal's comment" })
  @IsOptional()
  @IsString()
  principalComment?: string;

  @ApiPropertyOptional({ description: 'Next term opening date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  nextTermOpens?: string;

  @ApiPropertyOptional({ description: 'Next term closing date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  nextTermCloses?: string;
}

export class ReportCardQueryDto {
  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ description: 'Filter by academic year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ReportCardStatus })
  @IsOptional()
  @IsEnum(ReportCardStatus)
  status?: ReportCardStatus;
}

export class UpdateSubjectCommentDto {
  @ApiProperty({ description: 'Report card ID' })
  @IsUUID()
  reportCardId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ description: "Teacher's comment for this subject" })
  @IsString()
  teacherComment: string;
}