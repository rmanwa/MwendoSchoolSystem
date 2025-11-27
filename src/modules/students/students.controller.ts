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
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.studentsService.create(createStudentDto, schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students for the authenticated school' })
  @ApiResponse({ status: 200, description: 'Return all students.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() query: any, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.studentsService.findAll(query, schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Return the student.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.studentsService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req,
  ) {
    const schoolId = req.user.schoolId;
    return this.studentsService.update(id, updateStudentDto, schoolId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  remove(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.studentsService.remove(id, schoolId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import students from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Students imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    return this.studentsService.importFromCSV(file, req.user.schoolId);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Download CSV import template' })
  @ApiResponse({ status: 200, description: 'Template downloaded' })
  @HttpCode(HttpStatus.OK)
  downloadTemplate(@Res() res: Response) {
    const csv = `firstName,lastName,middleName,email,admissionNumber,dateOfBirth,gender,phone,address,className,admissionDate,password
James,Mwangi,Kamau,james.mwangi@school.com,NES2025001,2012-03-15,male,+254712000001,123 Nairobi Road,Grade 7A,2025-01-15,Student123
Mary,Wanjiru,Njeri,mary.wanjiru@school.com,NES2025002,2012-05-20,female,+254712000002,456 Thika Road,Grade 7A,2025-01-15,Student123
Peter,Omondi,Otieno,peter.omondi@school.com,NES2025003,2011-08-10,male,+254712000003,789 Mombasa Road,Grade 7B,2025-01-15,Student123`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_import_template.csv');
    res.send(csv);
  }
}