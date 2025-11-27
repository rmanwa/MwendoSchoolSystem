import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsDecimal,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({
    example: 'peter.kamau@ukambanischool.com',
    description: 'Teacher email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Peter',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Kamau',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    example: 'Mwangi',
    description: 'Middle name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({
    example: '+254722000001',
    description: 'Phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'TCH001',
    description: 'Employee ID',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeId: string;

  @ApiProperty({
    enum: ['male', 'female', 'other'],
    example: 'male',
    description: 'Gender',
  })
  @IsEnum(['male', 'female', 'other'])
  gender: string;

  @ApiPropertyOptional({
    example: '1985-05-20',
    description: 'Date of birth',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: '123 Nairobi Street',
    description: 'Address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Nairobi',
    description: 'City',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Nairobi',
    description: 'State/County',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: 'Kenya',
    description: 'Country',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '00100',
    description: 'Postal code',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'Bachelor of Education - Mathematics',
    description: 'Highest qualification',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @ApiPropertyOptional({
    example: 'Mathematics and Physics',
    description: 'Subject specialization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialization?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of teaching experience',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiProperty({
    example: '2020-01-15',
    description: 'Date joined school',
  })
  @IsString()
  @IsNotEmpty()
  joinDate: string;

  @ApiProperty({
    enum: ['full-time', 'part-time', 'contract'],
    example: 'full-time',
    description: 'Employment type',
  })
  @IsEnum(['full-time', 'part-time', 'contract'])
  @IsNotEmpty()
  employmentType: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Monthly salary',
  })
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({
    example: 'Equity Bank',
    description: 'Bank name',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Bank account number',
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'A001234567B',
    description: 'Tax ID / KRA PIN',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    example: 'Jane Kamau',
    description: 'Emergency contact name',
  })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({
    example: '+254711000000',
    description: 'Emergency contact phone',
  })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiProperty({
    enum: ['active', 'on-leave', 'resigned', 'terminated'],
    example: 'active',
    description: 'Employment status',
  })
  @IsEnum(['active', 'on-leave', 'resigned', 'terminated'])
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: 'Teacher123!@#',
    description: 'Login password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}