import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { CreateTermDto, UpdateTermDto, CreateAcademicYearWithTermsDto } from './dto/term.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Academic Years')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  // ==================== ACADEMIC YEAR ENDPOINTS ====================

  @Post()
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Create a new academic year' })
  @ApiResponse({ status: 201, description: 'Academic year created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid dates' })
  @ApiResponse({ status: 409, description: 'Conflict - Year already exists' })
  createAcademicYear(@Body() dto: CreateAcademicYearDto, @Req() req: any) {
    return this.academicYearsService.createAcademicYear(dto, req.user.schoolId);
  }

  @Post('with-terms')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Create academic year with all terms in one request' })
  @ApiResponse({ status: 201, description: 'Academic year and terms created successfully' })
  createWithTerms(@Body() dto: CreateAcademicYearWithTermsDto, @Req() req: any) {
    return this.academicYearsService.createWithTerms(dto, req.user.schoolId);
  }

  @Post('seed-kenyan/:year')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Seed Kenyan school calendar (3 terms) for a year' })
  @ApiParam({ name: 'year', example: 2025, description: 'Calendar year' })
  @ApiResponse({ status: 201, description: 'Kenyan calendar seeded successfully' })
  seedKenyanCalendar(@Param('year') year: string, @Req() req: any) {
    return this.academicYearsService.seedKenyanCalendar(parseInt(year), req.user.schoolId);
  }

  @Get()
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get all academic years' })
  @ApiResponse({ status: 200, description: 'List of academic years' })
  findAllAcademicYears(@Req() req: any) {
    return this.academicYearsService.findAllAcademicYears(req.user.schoolId);
  }

  @Get('current')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get current academic year' })
  @ApiResponse({ status: 200, description: 'Current academic year' })
  @ApiResponse({ status: 404, description: 'No current year set' })
  findCurrentAcademicYear(@Req() req: any) {
    return this.academicYearsService.findCurrentAcademicYear(req.user.schoolId);
  }

  @Get('calendar-overview')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get calendar overview (current year, term, stats)' })
  @ApiResponse({ status: 200, description: 'Calendar overview' })
  getCalendarOverview(@Req() req: any) {
    return this.academicYearsService.getCalendarOverview(req.user.schoolId);
  }

  @Get(':id')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get academic year by ID' })
  @ApiParam({ name: 'id', description: 'Academic Year ID' })
  @ApiResponse({ status: 200, description: 'Academic year details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOneAcademicYear(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.findOneAcademicYear(id, req.user.schoolId);
  }

  @Get(':id/with-terms')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get academic year with all its terms' })
  @ApiParam({ name: 'id', description: 'Academic Year ID' })
  @ApiResponse({ status: 200, description: 'Academic year with terms' })
  findAcademicYearWithTerms(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.findAcademicYearWithTerms(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Update academic year' })
  @ApiParam({ name: 'id', description: 'Academic Year ID' })
  @ApiResponse({ status: 200, description: 'Academic year updated successfully' })
  updateAcademicYear(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
    @Req() req: any,
  ) {
    return this.academicYearsService.updateAcademicYear(id, dto, req.user.schoolId);
  }

  @Patch(':id/set-current')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Set academic year as current' })
  @ApiParam({ name: 'id', description: 'Academic Year ID' })
  @ApiResponse({ status: 200, description: 'Academic year set as current' })
  setCurrentYear(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.setCurrentYear(id, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete academic year (and its terms)' })
  @ApiParam({ name: 'id', description: 'Academic Year ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  removeAcademicYear(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.removeAcademicYear(id, req.user.schoolId);
  }

  // ==================== TERM ENDPOINTS ====================

  @Post('terms')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Create a new term' })
  @ApiResponse({ status: 201, description: 'Term created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid dates' })
  @ApiResponse({ status: 409, description: 'Conflict - Term number already exists' })
  createTerm(@Body() dto: CreateTermDto, @Req() req: any) {
    return this.academicYearsService.createTerm(dto, req.user.schoolId);
  }

  @Get('terms/current')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get current term' })
  @ApiResponse({ status: 200, description: 'Current term' })
  @ApiResponse({ status: 404, description: 'No current term set' })
  findCurrentTerm(@Req() req: any) {
    return this.academicYearsService.findCurrentTerm(req.user.schoolId);
  }

  @Get(':academicYearId/terms')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get all terms for an academic year' })
  @ApiParam({ name: 'academicYearId', description: 'Academic Year ID' })
  @ApiResponse({ status: 200, description: 'List of terms' })
  findTermsByAcademicYear(@Param('academicYearId') academicYearId: string, @Req() req: any) {
    return this.academicYearsService.findTermsByAcademicYear(academicYearId, req.user.schoolId);
  }

  @Get('terms/:id')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get term by ID' })
  @ApiParam({ name: 'id', description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Term details' })
  findOneTerm(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.findOneTerm(id, req.user.schoolId);
  }

  @Patch('terms/:id')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Update term' })
  @ApiParam({ name: 'id', description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Term updated successfully' })
  updateTerm(
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
    @Req() req: any,
  ) {
    return this.academicYearsService.updateTerm(id, dto, req.user.schoolId);
  }

  @Patch('terms/:id/set-current')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Set term as current (also sets its academic year as current)' })
  @ApiParam({ name: 'id', description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Term set as current' })
  setCurrentTerm(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.setCurrentTerm(id, req.user.schoolId);
  }

  @Delete('terms/:id')
  @Roles('admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete term' })
  @ApiParam({ name: 'id', description: 'Term ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  removeTerm(@Param('id') id: string, @Req() req: any) {
    return this.academicYearsService.removeTerm(id, req.user.schoolId);
  }
}