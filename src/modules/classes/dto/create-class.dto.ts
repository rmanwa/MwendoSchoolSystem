import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 7A' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  section?: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  @Max(13)
  gradeLevel: number;

  @ApiPropertyOptional({ example: 'Junior Secondary, Grade 7 Section A' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'JSS Block, Room 101' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roomNumber?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  capacity?: number;

  @ApiPropertyOptional({ example: 'teacher-uuid-here' })
  @IsOptional()
  @IsUUID()
  classTeacherId?: string;

  @ApiPropertyOptional({ example: 'academic-year-uuid-here' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}