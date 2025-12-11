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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Curriculum } from '../../database/entities/subject.entity';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')  
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 409, description: 'Conflict - Subject code already exists' })
  create(@Body() createSubjectDto: CreateSubjectDto, @Req() req: any) {
    return this.subjectsService.create(createSubjectDto, req.user.schoolId);
  }

  @Get()
  @Roles('admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get all subjects for the school' })
  @ApiQuery({ name: 'curriculum', required: false, enum: Curriculum, description: 'Filter by curriculum' })
  @ApiResponse({ status: 200, description: 'List of subjects' })
  findAll(@Req() req: any, @Query('curriculum') curriculum?: Curriculum) {
    return this.subjectsService.findAll(req.user.schoolId, curriculum);
  }

  @Get('statistics')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Get subject statistics' })
  @ApiResponse({ status: 200, description: 'Subject statistics' })
  getStatistics(@Req() req: any) {
    return this.subjectsService.getStatistics(req.user.schoolId);
  }

  @Get('grade/:gradeLevel')
  @Roles('admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get subjects by grade level' })
  @ApiParam({ name: 'gradeLevel', description: 'Grade level (1-13)', example: 7 })
  @ApiResponse({ status: 200, description: 'List of subjects for the grade level' })
  findByGradeLevel(@Param('gradeLevel') gradeLevel: string, @Req() req: any) {
    return this.subjectsService.findByGradeLevel(req.user.schoolId, parseInt(gradeLevel));
  }

  @Get('category/:category')
  @Roles('admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get subjects by category' })
  @ApiParam({ name: 'category', description: 'Subject category', example: 'science' })
  @ApiResponse({ status: 200, description: 'List of subjects in the category' })
  findByCategory(@Param('category') category: string, @Req() req: any) {
    return this.subjectsService.findByCategory(req.user.schoolId, category);
  }

  @Get('compulsory')
  @Roles('admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get compulsory subjects' })
  @ApiQuery({ name: 'gradeLevel', required: false, description: 'Filter by grade level' })
  @ApiResponse({ status: 200, description: 'List of compulsory subjects' })
  findCompulsory(@Req() req: any, @Query('gradeLevel') gradeLevel?: string) {
    const grade = gradeLevel ? parseInt(gradeLevel) : undefined;
    return this.subjectsService.findCompulsory(req.user.schoolId, grade);
  }

  @Post('seed/:curriculum')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed predefined subjects for a curriculum' })
  @ApiParam({ 
    name: 'curriculum', 
    enum: Curriculum, 
    description: 'Curriculum to seed subjects for',
    example: 'cbc'
  })
  @ApiResponse({ status: 201, description: 'Subjects seeded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid curriculum' })
  seedSubjects(@Param('curriculum') curriculum: Curriculum, @Req() req: any) {
    return this.subjectsService.seedPredefinedSubjects(req.user.schoolId, curriculum);
  }

  @Get(':id')
  @Roles('admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({ status: 200, description: 'Subject details' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.subjectsService.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiResponse({ status: 200, description: 'Subject updated successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto, @Req() req: any) {
    return this.subjectsService.update(id, updateSubjectDto, req.user.schoolId);
  }

  @Patch(':id/assign-teacher/:teacherId')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign a teacher to a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiParam({ name: 'teacherId', description: 'Teacher ID' })
  @ApiResponse({ status: 200, description: 'Teacher assigned successfully' })
  @ApiResponse({ status: 404, description: 'Subject or teacher not found' })
  assignTeacher(@Param('id') id: string, @Param('teacherId') teacherId: string, @Req() req: any) {
    return this.subjectsService.assignTeacher(id, teacherId, req.user.schoolId);
  }

  @Patch(':id/unassign-teacher')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove teacher assignment from a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Teacher unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  unassignTeacher(@Param('id') id: string, @Req() req: any) {
    return this.subjectsService.unassignTeacher(id, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiResponse({ status: 204, description: 'Subject deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.subjectsService.remove(id, req.user.schoolId);
  }
}