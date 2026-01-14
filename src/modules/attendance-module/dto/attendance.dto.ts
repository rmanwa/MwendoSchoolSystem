import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsEnum,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  HALF_DAY = 'half_day',
}

// DTO for marking single student attendance
export class CreateAttendanceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: '2025-12-12', description: 'Date of attendance' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT, description: 'Attendance status' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ example: '08:45', description: 'Arrival time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  arrivalTime?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Departure time (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  departureTime?: string;

  @ApiPropertyOptional({ example: 'Sick - flu symptoms', description: 'Reason for absence' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'Parent notified via SMS', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// DTO for updating attendance
export class UpdateAttendanceDto {
  @ApiPropertyOptional({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: '08:45', description: 'Arrival time' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  arrivalTime?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Departure time' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  departureTime?: string;

  @ApiPropertyOptional({ example: 'Doctor appointment', description: 'Reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'Sick note received', description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// Single student record for bulk marking
export class StudentAttendanceRecord {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT, description: 'Status' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: '08:45', description: 'Arrival time' })
  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @ApiPropertyOptional({ example: 'Late due to traffic', description: 'Reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO for bulk marking attendance (whole class at once)
export class BulkMarkAttendanceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: '2025-12-12', description: 'Date' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiProperty({
    type: [StudentAttendanceRecord],
    description: 'Attendance records for all students',
    example: [
      { studentId: 'uuid-1', status: 'present' },
      { studentId: 'uuid-2', status: 'absent', reason: 'Sick' },
      { studentId: 'uuid-3', status: 'late', arrivalTime: '08:45' },
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceRecord)
  records: StudentAttendanceRecord[];
}

// DTO for marking all present (quick mark)
export class QuickMarkAllPresentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: '2025-12-12', description: 'Date' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Academic Year ID' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;
}

// Query filters for attendance reports
export class AttendanceQueryDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Filter by Class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Filter by Student ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: '2025-12-01', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Filter by Academic Year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'Filter by Term' })
  @IsOptional()
  @IsUUID()
  termId?: string;
}