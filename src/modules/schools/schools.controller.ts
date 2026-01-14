import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, SubscriptionTier } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { QuerySchoolDto } from './dto/query-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  // ============================================
  // PUBLIC ENDPOINTS (No Auth Required)
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Register a new school (Public - for school enrollment)' })
  @ApiResponse({ status: 201, description: 'School registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 409, description: 'Conflict - School already exists' })
  create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get('lookup/slug/:slug')
  @ApiOperation({ summary: 'Find school by slug (Public - for portal routing)' })
  @ApiParam({ name: 'slug', description: 'School slug', example: 'ukambani-school' })
  @ApiResponse({ status: 200, description: 'School found' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.schoolsService.findBySlug(slug);
  }

  @Get('lookup/subdomain/:subdomain')
  @ApiOperation({ summary: 'Find school by subdomain (Public - for portal routing)' })
  @ApiParam({ name: 'subdomain', description: 'School subdomain', example: 'ukambani' })
  @ApiResponse({ status: 200, description: 'School found' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findBySubdomain(@Param('subdomain') subdomain: string) {
    return this.schoolsService.findBySubdomain(subdomain);
  }

  @Get('lookup/code/:code')
  @ApiOperation({ summary: 'Find school by code (Public - for enrollment forms)' })
  @ApiParam({ name: 'code', description: 'School code', example: 'UKS001' })
  @ApiResponse({ status: 200, description: 'School found' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findByCode(@Param('code') code: string) {
    return this.schoolsService.findByCode(code);
  }

  // ============================================
  // PROTECTED ENDPOINTS (Auth Required)
  // ============================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all schools with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of schools' })
  findAll(@Query() queryDto: QuerySchoolDto) {
    return this.schoolsService.findAll(queryDto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get schools statistics' })
  @ApiResponse({ status: 200, description: 'Schools statistics' })
  getStatistics() {
    return this.schoolsService.getStatistics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'school_admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a school by ID' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School details' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'school_admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a school' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate name/code' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a school (soft delete)' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School deactivated' })
  @ApiResponse({ status: 404, description: 'School not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.remove(id);
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a school (DANGEROUS - Super Admin only)' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School permanently deleted' })
  @ApiResponse({ status: 404, description: 'School not found' })
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.hardDelete(id);
  }

  // ============================================
  // ADMIN ACTIONS
  // ============================================

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate a school' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School activated' })
  @ApiResponse({ status: 404, description: 'School not found' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.activate(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify a school' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'School verified' })
  @ApiResponse({ status: 404, description: 'School not found' })
  verify(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.verify(id);
  }

  @Patch(':id/subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update school subscription' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiQuery({ name: 'tier', enum: SubscriptionTier, description: 'Subscription tier' })
  @ApiQuery({ name: 'months', required: false, description: 'Duration in months (default: 12)' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  @ApiResponse({ status: 404, description: 'School not found' })
  updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tier') tier: SubscriptionTier,
    @Query('months') months?: number,
  ) {
    return this.schoolsService.updateSubscription(id, tier, months || 12);
  }

  @Patch(':id/onboarding/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'school_admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiParam({ name: 'id', description: 'School UUID' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  @ApiResponse({ status: 404, description: 'School not found' })
  completeOnboarding(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.completeOnboarding(id);
  }
}