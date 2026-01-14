import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClassSubjectDto } from './create-class-subject.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassSubjectDto extends PartialType(
  OmitType(CreateClassSubjectDto, ['classId', 'subjectId'] as const)
) {
  @ApiPropertyOptional({ 
    example: true, 
    description: 'Is this assignment active?' 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}