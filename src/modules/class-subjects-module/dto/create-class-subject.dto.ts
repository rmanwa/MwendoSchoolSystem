import {
  IsUUID,
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClassSubjectDto {
  @ApiProperty({ 
    example: '1478bf34-4361-4ead-b221-d07d241c52f0', 
    description: 'Class ID' 
  })
  @IsUUID()
  classId: string;

  @ApiProperty({ 
    example: 'c57775c3-8159-45d3-acce-41e1062a6ee8', 
    description: 'Subject ID' 
  })
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional({ 
    example: 'ad8fa405-e05c-47e2-b60e-2ddb29eee987', 
    description: 'Teacher ID (optional)' 
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Lessons per week (overrides subject default)' 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  lessonsPerWeek?: number;

  @ApiPropertyOptional({ 
    example: 'morning', 
    description: 'Schedule preference (morning/afternoon/any)' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schedulePreference?: string;

  @ApiPropertyOptional({ 
    example: 'Room 101', 
    description: 'Room number for this subject' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumber?: string;

  @ApiPropertyOptional({ 
    example: 'Advanced group - focus on problem solving', 
    description: 'Notes or special instructions' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// DTO for bulk assignment
export class BulkAssignSubjectsDto {
  @ApiProperty({ 
    example: '1478bf34-4361-4ead-b221-d07d241c52f0', 
    description: 'Class ID' 
  })
  @IsUUID()
  classId: string;

  @ApiProperty({ 
    type: [String],
    example: ['c57775c3-8159-45d3-acce-41e1062a6ee8', '90c623f0-1127-488b-b6f8-8b26ebd5deb9'],
    description: 'Array of Subject IDs to assign' 
  })
  @IsArray()
  @IsUUID('4', { each: true })
  subjectIds: string[];
}

// DTO for assigning teacher to class-subject
export class AssignTeacherDto {
  @ApiProperty({ 
    example: 'ad8fa405-e05c-47e2-b60e-2ddb29eee987', 
    description: 'Teacher ID' 
  })
  @IsUUID()
  teacherId: string;
}

// DTO for auto-assigning subjects based on grade level
export class AutoAssignSubjectsDto {
  @ApiProperty({ 
    example: '1478bf34-4361-4ead-b221-d07d241c52f0', 
    description: 'Class ID' 
  })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Only assign compulsory subjects',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  compulsoryOnly?: boolean;

  @ApiPropertyOptional({ 
    example: 'cbc', 
    description: 'Filter by curriculum' 
  })
  @IsOptional()
  @IsString()
  curriculum?: string;
}