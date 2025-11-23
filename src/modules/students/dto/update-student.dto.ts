import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'john.doe@student.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'STU2025001' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  admissionNumber?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional({ example: '2008-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ['male', 'female', 'other'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Nairobi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ 
    example: 'class-uuid-here',
    description: 'Class ID to enroll student in'
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ 
    enum: ['active', 'suspended', 'graduated', 'transferred', 'expelled'],
    example: 'active'
  })
  @IsOptional()
  @IsEnum(['active', 'suspended', 'graduated', 'transferred', 'expelled'])
  status?: string;

  @ApiPropertyOptional({ example: 'Student123!@#' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}