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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  UpdateExamDto,
  ExamQueryDto,
} from './dto/exam.dto';
import {
  CreateGradeDto,
  UpdateGradeDto,
  BulkGradeEntryDto,
  GradeQueryDto,
  Curriculum,
} from './dto/grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Exams & Grades')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ==================== EXAM ENDPOINTS ====================

  @Post()
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  createExam(@Body() dto: CreateExamDto, @Req() req: any) {
    return this.examsService.createExam(dto, req.user.schoolId);
  }

  @Get()
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get all exams with filters' })
  @ApiResponse({ status: 200, description: 'List of exams' })
  findAllExams(@Query() query: ExamQueryDto, @Req() req: any) {
    return this.examsService.findAllExams(query, req.user.schoolId);
  }

  @Get('grading-scales')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get grading scales for all curricula' })
  @ApiQuery({ name: 'curriculum', required: false, enum: Curriculum, description: 'Specific curriculum' })
  @ApiResponse({ status: 200, description: 'Grading scales' })
  getGradingScales(@Query('curriculum') curriculum?: Curriculum) {
    return this.examsService.getGradingScales(curriculum);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get exam by ID' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam details' })
  findOneExam(@Param('id') id: string, @Req() req: any) {
    return this.examsService.findOneExam(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Update exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam updated' })
  updateExam(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @Req() req: any,
  ) {
    return this.examsService.updateExam(id, dto, req.user.schoolId);
  }

  @Patch(':id/publish')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Publish exam results' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Results published' })
  publishResults(@Param('id') id: string, @Req() req: any) {
    return this.examsService.publishResults(id, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  removeExam(@Param('id') id: string, @Req() req: any) {
    return this.examsService.removeExam(id, req.user.schoolId);
  }

  @Get(':id/results')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get exam results with statistics' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 200, description: 'Exam results with statistics' })
  getExamResults(@Param('id') id: string, @Req() req: any) {
    return this.examsService.getExamResults(id, req.user.schoolId);
  }

  // ==================== GRADE ENDPOINTS ====================

  @Post('grades')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Enter grade for single student' })
  @ApiQuery({ name: 'curriculum', required: false, enum: Curriculum, description: 'Curriculum for grading' })
  @ApiResponse({ status: 201, description: 'Grade entered successfully' })
  createGrade(
    @Body() dto: CreateGradeDto,
    @Query('curriculum') curriculum: Curriculum,
    @Req() req: any,
  ) {
    return this.examsService.createGrade(dto, req.user.schoolId, req.user.id, curriculum);
  }

  @Post('grades/bulk')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Bulk enter grades for entire class' })
  @ApiResponse({ status: 201, description: 'Grades entered successfully' })
  bulkEnterGrades(@Body() dto: BulkGradeEntryDto, @Req() req: any) {
    return this.examsService.bulkEnterGrades(dto, req.user.schoolId, req.user.id);
  }

  @Get('grades')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get grades with filters' })
  @ApiResponse({ status: 200, description: 'List of grades' })
  findAllGrades(@Query() query: GradeQueryDto, @Req() req: any) {
    return this.examsService.findAllGrades(query, req.user.schoolId);
  }

  @Get('grades/:id')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get grade by ID' })
  @ApiParam({ name: 'id', description: 'Grade ID' })
  @ApiResponse({ status: 200, description: 'Grade details' })
  findOneGrade(@Param('id') id: string, @Req() req: any) {
    return this.examsService.findOneGrade(id, req.user.schoolId);
  }

  @Patch('grades/:id')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Update grade' })
  @ApiParam({ name: 'id', description: 'Grade ID' })
  @ApiQuery({ name: 'curriculum', required: false, enum: Curriculum, description: 'Curriculum for grading' })
  @ApiResponse({ status: 200, description: 'Grade updated' })
  updateGrade(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
    @Query('curriculum') curriculum: Curriculum,
    @Req() req: any,
  ) {
    return this.examsService.updateGrade(id, dto, req.user.schoolId, curriculum);
  }

  @Delete('grades/:id')
  @Roles('super_admin', 'admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete grade' })
  @ApiParam({ name: 'id', description: 'Grade ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  removeGrade(@Param('id') id: string, @Req() req: any) {
    return this.examsService.removeGrade(id, req.user.schoolId);
  }

  // ==================== REPORT CARD & RANKINGS ====================

  @Get('report-card/:studentId')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Generate student report card' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'termId', required: true, description: 'Term ID' })
  @ApiQuery({ name: 'curriculum', required: false, enum: Curriculum, description: 'Curriculum' })
  @ApiResponse({ status: 200, description: 'Report card generated' })
  generateReportCard(
    @Param('studentId') studentId: string,
    @Query('termId') termId: string,
    @Query('curriculum') curriculum: Curriculum,
    @Req() req: any,
  ) {
    return this.examsService.generateReportCard(studentId, termId, req.user.schoolId, curriculum);
  }

  @Get('class-ranking/:classId')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get class ranking/leaderboard' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'termId', required: true, description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Class ranking' })
  getClassRanking(
    @Param('classId') classId: string,
    @Query('termId') termId: string,
    @Req() req: any,
  ) {
    return this.examsService.getClassRanking(classId, termId, req.user.schoolId);
  }

  @Get('subject-performance/:subjectId/:classId')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get subject performance analysis' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'termId', required: true, description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Subject performance' })
  getSubjectPerformance(
    @Param('subjectId') subjectId: string,
    @Param('classId') classId: string,
    @Query('termId') termId: string,
    @Req() req: any,
  ) {
    return this.examsService.getSubjectPerformance(subjectId, classId, termId, req.user.schoolId);
  }
}