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
import { ClassSubjectsService } from './class-subjects.service';
import { 
  CreateClassSubjectDto, 
  BulkAssignSubjectsDto,
  AutoAssignSubjectsDto,
  AssignTeacherDto,
} from './dto/create-class-subject.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Class Subjects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('class-subjects')
export class ClassSubjectsController {
  constructor(private readonly classSubjectsService: ClassSubjectsService) {}

  // ==================== CREATE ASSIGNMENTS ====================

  @Post()
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Assign a subject to a class' })
  @ApiResponse({ status: 201, description: 'Subject assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or grade level mismatch' })
  @ApiResponse({ status: 404, description: 'Class, Subject, or Teacher not found' })
  @ApiResponse({ status: 409, description: 'Subject already assigned to this class' })
  create(@Body() dto: CreateClassSubjectDto, @Req() req: any) {
    return this.classSubjectsService.create(dto, req.user.schoolId);
  }

  @Post('bulk')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Bulk assign multiple subjects to a class' })
  @ApiResponse({ status: 201, description: 'Subjects assigned successfully' })
  @ApiResponse({ status: 404, description: 'Class or subjects not found' })
  bulkAssign(@Body() dto: BulkAssignSubjectsDto, @Req() req: any) {
    return this.classSubjectsService.bulkAssign(dto, req.user.schoolId);
  }

  @Post('auto-assign')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Auto-assign subjects based on class grade level' })
  @ApiResponse({ status: 201, description: 'Subjects auto-assigned successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  autoAssign(@Body() dto: AutoAssignSubjectsDto, @Req() req: any) {
    return this.classSubjectsService.autoAssign(dto, req.user.schoolId);
  }

  @Post('copy/:sourceClassId/:targetClassId')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Copy subject assignments from one class to another' })
  @ApiParam({ name: 'sourceClassId', description: 'Source class ID' })
  @ApiParam({ name: 'targetClassId', description: 'Target class ID' })
  @ApiResponse({ status: 201, description: 'Assignments copied successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  copyAssignments(
    @Param('sourceClassId') sourceClassId: string,
    @Param('targetClassId') targetClassId: string,
    @Req() req: any,
  ) {
    return this.classSubjectsService.copyAssignments(sourceClassId, targetClassId, req.user.schoolId);
  }

  // ==================== READ ASSIGNMENTS ====================

  @Get('class/:classId')
  @Roles('admin', 'school_admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get all subjects assigned to a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'List of subject assignments' })
  findByClass(@Param('classId') classId: string, @Req() req: any) {
    return this.classSubjectsService.findByClass(classId, req.user.schoolId);
  }

  @Get('subject/:subjectId')
  @Roles('admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get all classes that have a subject assigned' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'List of class assignments' })
  findBySubject(@Param('subjectId') subjectId: string, @Req() req: any) {
    return this.classSubjectsService.findBySubject(subjectId, req.user.schoolId);
  }

  @Get('teacher/:teacherId')
  @Roles('admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get all class-subject assignments for a teacher' })
  @ApiParam({ name: 'teacherId', description: 'Teacher ID' })
  @ApiResponse({ status: 200, description: 'List of teacher assignments' })
  findByTeacher(@Param('teacherId') teacherId: string, @Req() req: any) {
    return this.classSubjectsService.findByTeacher(teacherId, req.user.schoolId);
  }

  @Get('my-assignments')
  @Roles('teacher')
  @ApiOperation({ summary: 'Get current teacher\'s class-subject assignments' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  getMyAssignments(@Req() req: any) {
    // Assumes teacherId is stored in user token or can be fetched
    return this.classSubjectsService.findByTeacher(req.user.teacherId, req.user.schoolId);
  }

  @Get('statistics')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Get class-subject assignment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  getStatistics(@Req() req: any) {
    return this.classSubjectsService.getStatistics(req.user.schoolId);
  }

  @Get(':id')
  @Roles('admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get a single class-subject assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment details' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.classSubjectsService.findOne(id, req.user.schoolId);
  }

  // ==================== UPDATE ASSIGNMENTS ====================

  @Patch(':id')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Update a class-subject assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassSubjectDto,
    @Req() req: any,
  ) {
    return this.classSubjectsService.update(id, dto, req.user.schoolId);
  }

  @Patch(':id/assign-teacher')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Assign a teacher to teach this subject in this class' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Teacher assigned successfully' })
  @ApiResponse({ status: 404, description: 'Assignment or teacher not found' })
  assignTeacher(
    @Param('id') id: string,
    @Body() dto: AssignTeacherDto,
    @Req() req: any,
  ) {
    return this.classSubjectsService.assignTeacher(id, dto.teacherId, req.user.schoolId);
  }

  @Patch(':id/unassign-teacher')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Remove teacher from this class-subject assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Teacher unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  unassignTeacher(@Param('id') id: string, @Req() req: any) {
    return this.classSubjectsService.unassignTeacher(id, req.user.schoolId);
  }

  // ==================== DELETE ASSIGNMENTS ====================

  @Delete(':id')
  @Roles('admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a subject assignment from a class' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 204, description: 'Assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.classSubjectsService.remove(id, req.user.schoolId);
  }

  @Delete('class/:classId/all')
  @Roles('admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove all subject assignments from a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 204, description: 'All assignments removed successfully' })
  removeAllForClass(@Param('classId') classId: string, @Req() req: any) {
    return this.classSubjectsService.removeAllForClass(classId, req.user.schoolId);
  }
}