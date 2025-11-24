import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  isDateString,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'john.doe@student.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'STU2025001' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  admissionNumber: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'Michael' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({ example: '2008-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  admissionDate: string;

  @ApiProperty({ enum: ['male', 'female', 'other'], example: 'male' })
  @IsEnum(['male', 'female', 'other'])
  gender: string;

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