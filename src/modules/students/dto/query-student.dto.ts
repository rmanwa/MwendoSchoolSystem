import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStudentDto {
  @ApiPropertyOptional({ example: 'John', description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: ['active', 'suspended', 'graduated', 'transferred', 'expelled'],
    example: 'active'
  })
  @IsOptional()
  @IsEnum(['active', 'suspended', 'graduated', 'transferred', 'expelled'])
  status?: string;

  @ApiPropertyOptional({ example: 'class-uuid', description: 'Filter by class' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}