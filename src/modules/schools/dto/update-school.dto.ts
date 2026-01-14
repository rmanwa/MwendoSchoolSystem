import { PartialType } from '@nestjs/swagger';
import { CreateSchoolDto } from './create-school.dto';
import { IsBoolean, IsOptional, IsDate, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from './create-school.dto';

export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {
  @ApiPropertyOptional({ example: true, description: 'Is school active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Is school verified' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Onboarding completed' })
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Subscription status' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Trial end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  trialEndsAt?: Date;

  @ApiPropertyOptional({ description: 'Subscription start date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscriptionStartsAt?: Date;

  @ApiPropertyOptional({ description: 'Subscription end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscriptionEndsAt?: Date;
}