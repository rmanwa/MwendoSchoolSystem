import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new teacher' })
  @ApiResponse({ status: 201, description: 'Teacher created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email or employee ID already exists' })
  create(@Body() createTeacherDto: CreateTeacherDto, @Request() req) {
    return this.teachersService.create(createTeacherDto, req.user.schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'on-leave', 'resigned', 'terminated'],
    description: 'Filter by status (optional)',
  })
  @ApiResponse({ status: 200, description: 'Teachers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.teachersService.findByStatus(req.user.schoolId, status);
    }
    return this.teachersService.findAll(req.user.schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.teachersService.findOne(id, req.user.schoolId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get teacher statistics' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  getTeacherStats(@Param('id') id: string, @Request() req) {
    return this.teachersService.getTeacherStats(id, req.user.schoolId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  @ApiResponse({ status: 409, description: 'Email or employee ID conflict' })
  update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @Request() req,
  ) {
    return this.teachersService.update(id, updateTeacherDto, req.user.schoolId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher' })
  @ApiParam({ name: 'id', description: 'Teacher UUID' })
  @ApiResponse({ status: 204, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.teachersService.remove(id, req.user.schoolId);
  }
}