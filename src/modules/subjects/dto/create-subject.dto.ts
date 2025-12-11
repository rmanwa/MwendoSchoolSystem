import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectCategory, Curriculum } from '../../../database/entities/subject.entity';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name',
    example: 'Mathematics',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Subject code (e.g., MATH101)',
    example: 'MATH101',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Subject category',
    enum: SubjectCategory,
    example: SubjectCategory.MATHEMATICS,
  })
  @IsEnum(SubjectCategory)
  @IsNotEmpty()
  category: SubjectCategory;

  @ApiProperty({
    description: 'Curriculum type',
    enum: Curriculum,
    example: Curriculum.CBC,
  })
  @IsEnum(Curriculum)
  @IsNotEmpty()
  curriculum: Curriculum;

  @ApiPropertyOptional({
    description: 'Subject description',
    example: 'Core mathematics covering algebra, geometry, and statistics',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Starting grade level (1=PP1, 2=PP2, 3=Grade1...13=Form4)',
    example: 1,
    minimum: 1,
    maximum: 13,
  })
  @IsInt()
  @Min(1)
  @Max(13)
  gradeLevelStart: number;

  @ApiProperty({
    description: 'Ending grade level (1=PP1, 2=PP2, 3=Grade1...13=Form4)',
    example: 13,
    minimum: 1,
    maximum: 13,
  })
  @IsInt()
  @Min(1)
  @Max(13)
  gradeLevelEnd: number;

  @ApiPropertyOptional({
    description: 'Is this subject compulsory?',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCompulsory?: boolean;

  @ApiPropertyOptional({
    description: 'Default teacher ID for this subject',
    example: 'uuid-here',
  })
  @IsString()
  @IsOptional()
  defaultTeacherId?: string;

  @ApiPropertyOptional({
    description: 'Credit hours (for credit-based curricula like IB, American)',
    example: 4.0,
  })
  @IsNumber()
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({
    description: 'Number of lessons per week',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  lessonsPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata (curriculum-specific)',
    example: { difficulty: 'intermediate', prerequisites: ['Basic Math'] },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}