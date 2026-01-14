import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Curriculum enum for grade calculation
export enum Curriculum {
  CBC = 'cbc',
  EIGHT_FOUR_FOUR = '8-4-4',
  CAMBRIDGE = 'cambridge',
  IB = 'ib',
  AMERICAN = 'american',
}

// Single grade entry
export class CreateGradeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Exam ID' })
  @IsUUID()
  examId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 85, description: 'Marks obtained' })
  @IsNumber()
  @Min(0)
  marksObtained: number;

  @ApiPropertyOptional({ example: false, description: 'Was student absent?' })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiPropertyOptional({ example: 'Good performance', description: 'Remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ example: 'Keep up the good work!', description: 'Teacher comment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  teacherComment?: string;
}

// Update grade
export class UpdateGradeDto {
  @ApiPropertyOptional({ example: 90, description: 'Marks obtained' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marksObtained?: number;

  @ApiPropertyOptional({ example: false, description: 'Was student absent?' })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Is student exempted?' })
  @IsOptional()
  @IsBoolean()
  isExempted?: boolean;

  @ApiPropertyOptional({ example: 'Medical condition', description: 'Exemption reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  exemptionReason?: string;

  @ApiPropertyOptional({ example: 'Improved from last time', description: 'Remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ example: 'Excellent improvement!', description: 'Teacher comment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  teacherComment?: string;
}

// Single student score for bulk entry
export class StudentScoreDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 85, description: 'Marks obtained' })
  @IsNumber()
  @Min(0)
  marksObtained: number;

  @ApiPropertyOptional({ example: false, description: 'Was student absent?' })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;

  @ApiPropertyOptional({ example: 'Good work', description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// Bulk grade entry for entire class
export class BulkGradeEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Exam ID' })
  @IsUUID()
  examId: string;

  @ApiProperty({
    type: [StudentScoreDto],
    description: 'Array of student scores',
    example: [
      { studentId: 'uuid-1', marksObtained: 85 },
      { studentId: 'uuid-2', marksObtained: 72 },
      { studentId: 'uuid-3', marksObtained: 0, isAbsent: true },
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentScoreDto)
  scores: StudentScoreDto[];

  @ApiPropertyOptional({ enum: Curriculum, description: 'Curriculum for grade calculation' })
  @IsOptional()
  @IsEnum(Curriculum)
  curriculum?: Curriculum;
}

// Query filters for grades
export class GradeQueryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Filter by Exam ID' })
  @IsOptional()
  @IsUUID()
  examId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Filter by Student ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Filter by Class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Filter by Subject ID' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'Filter by Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;
}

// Report card request
export class ReportCardRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ enum: Curriculum, description: 'Curriculum for grading' })
  @IsOptional()
  @IsEnum(Curriculum)
  curriculum?: Curriculum;
}

// Class ranking request
export class ClassRankingRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Subject ID (for subject ranking)' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;
}

// GPA calculation request (American)
export class GPACalculationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: true, description: 'Include weighted GPA (for AP/Honors)' })
  @IsOptional()
  @IsBoolean()
  weighted?: boolean;
}

// IB Score calculation request
export class IBScoreCalculationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'B', description: 'TOK Grade (A-E)' })
  @IsString()
  tokGrade: string;

  @ApiProperty({ example: 'A', description: 'Extended Essay Grade (A-E)' })
  @IsString()
  eeGrade: string;
}

// Mean grade calculation request (8-4-4)
export class MeanGradeCalculationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;
}