import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Role } from '../../../common/constants/roles.constant';

export class RegisterDto {
  // School selection
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of existing school to join (optional)',
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiPropertyOptional({
    example: 'MwendoSchool Academy',
    description: 'Name of new school to create (optional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  schoolName?: string;

  // User details
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsPhoneNumber('KE')
  phone?: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

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

  @ApiPropertyOptional({ enum: Role, example: Role.STUDENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // --- CRITICAL FIX START: Add these missing fields ---
  @ApiPropertyOptional({ 
    example: '123 Moi Avenue, Nairobi', 
    description: 'Physical address' 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ 
    example: 'active', 
    enum: ['active', 'inactive', 'pending'] 
  })
  @IsOptional()
  @IsString()
  status?: string;
  // --- CRITICAL FIX END ---

  // Role-specific fields
  @ApiPropertyOptional({ example: 'ADM2024001' })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @ApiPropertyOptional({ example: 'EMP2024001' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '2010-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string; // Use string for better JSON compatibility

  @ApiPropertyOptional({ enum: ['male', 'female', 'other'], example: 'male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    enum: ['father', 'mother', 'guardian', 'other'],
    example: 'father',
  })
  @IsOptional()
  @IsString()
  relationship?: string;
}