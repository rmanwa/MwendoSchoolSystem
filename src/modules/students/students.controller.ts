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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createStudentDto: CreateStudentDto, @Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.studentsService.create(createStudentDto, schoolId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all students for the authenticated school' })
  @ApiResponse({ status: 200, description: 'Return all students.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() query: any, @Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.studentsService.findAll(query, schoolId);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Return the student.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.studentsService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Req() req: any,
  ) {
    const schoolId = req.user.schoolId;
    return this.studentsService.update(id, updateStudentDto, schoolId);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  remove(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.studentsService.remove(id, schoolId);
  }
}