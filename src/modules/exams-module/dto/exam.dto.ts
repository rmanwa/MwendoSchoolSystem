import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExamType {
  FORMATIVE = 'formative',
  SUMMATIVE = 'summative',
  PROJECT = 'project',
  PRACTICAL = 'practical',
  PORTFOLIO = 'portfolio',
  CAT = 'cat',
  MIDTERM = 'midterm',
  ENDTERM = 'endterm',
  MOCK = 'mock',
  FINAL = 'final',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  ORAL = 'oral',
  LAB = 'lab',
}

export enum ExamStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  GRADED = 'graded',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

export class CreateExamDto {
  @ApiProperty({ example: 'Term 1 Mathematics CAT 1', description: 'Exam name' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Covers chapters 1-3', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ExamType, example: ExamType.CAT, description: 'Type of exam' })
  @IsEnum(ExamType)
  type: ExamType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'Teacher ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ example: 100, description: 'Total marks' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalMarks?: number;

  @ApiPropertyOptional({ example: 40, description: 'Passing marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiPropertyOptional({ example: 30, description: 'Weight percentage for final grade calculation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPercentage?: number;

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Exam date' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Start time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '11:00', description: 'End time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  endTime?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Venue' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venue?: string;

  @ApiPropertyOptional({ example: 'No calculators allowed', description: 'Instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({ example: '2026-03-20', description: 'Grading deadline' })
  @IsOptional()
  @IsDateString()
  gradingDeadline?: string;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Term 1 Mathematics CAT 1', description: 'Exam name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ExamType, description: 'Type of exam' })
  @IsOptional()
  @IsEnum(ExamType)
  type?: ExamType;

  @ApiPropertyOptional({ enum: ExamStatus, description: 'Exam status' })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ example: 100, description: 'Total marks' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  totalMarks?: number;

  @ApiPropertyOptional({ example: 40, description: 'Passing marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @ApiPropertyOptional({ example: 30, description: 'Weight percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPercentage?: number;

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Exam date' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Start time' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '11:00', description: 'End time' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Venue' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venue?: string;

  @ApiPropertyOptional({ example: 'Updated instructions', description: 'Instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({ example: '2026-03-20', description: 'Grading deadline' })
  @IsOptional()
  @IsDateString()
  gradingDeadline?: string;
}

// Query filters for exams
export class ExamQueryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Filter by Class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Filter by Subject ID' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ enum: ExamType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(ExamType)
  type?: ExamType;

  @ApiPropertyOptional({ enum: ExamStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Filter by Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Filter by Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'Filter by Teacher ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}