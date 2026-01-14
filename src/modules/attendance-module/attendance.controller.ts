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
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkMarkAttendanceDto,
  QuickMarkAllPresentDto,
  AttendanceQueryDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==================== MARKING ATTENDANCE ====================

  @Post()
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Mark attendance for a single student' })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 409, description: 'Attendance already marked' })
  create(@Body() dto: CreateAttendanceDto, @Req() req: any) {
    return this.attendanceService.create(dto, req.user.schoolId, req.user.id);
  }

  @Post('bulk')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Bulk mark attendance for entire class' })
  @ApiResponse({ status: 201, description: 'Bulk attendance marked' })
  bulkMark(@Body() dto: BulkMarkAttendanceDto, @Req() req: any) {
    return this.attendanceService.bulkMark(dto, req.user.schoolId, req.user.id);
  }

  @Post('quick-mark-present')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Quick mark all students in class as present' })
  @ApiResponse({ status: 201, description: 'All students marked present' })
  quickMarkAllPresent(@Body() dto: QuickMarkAllPresentDto, @Req() req: any) {
    return this.attendanceService.quickMarkAllPresent(
      dto,
      req.user.schoolId,
      req.user.id,
    );
  }

  // ==================== QUERIES ====================

  @Get()
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get attendance records with filters' })
  @ApiResponse({ status: 200, description: 'List of attendance records' })
  findAll(@Query() query: AttendanceQueryDto, @Req() req: any) {
    return this.attendanceService.findAll(query, req.user.schoolId);
  }

  @Get('today')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: "Get today's attendance summary" })
  @ApiResponse({ status: 200, description: "Today's summary" })
  getTodaySummary(@Req() req: any) {
    return this.attendanceService.getTodaySummary(req.user.schoolId);
  }

  @Get('class/:classId/date/:date')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get attendance for a class on a specific date' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiParam({
    name: 'date',
    description: 'Date (YYYY-MM-DD)',
    example: '2025-12-12',
  })
  @ApiResponse({ status: 200, description: 'Class attendance with summary' })
  getClassAttendance(
    @Param('classId') classId: string,
    @Param('date') date: string,
    @Req() req: any,
  ) {
    return this.attendanceService.getClassAttendance(
      classId,
      date,
      req.user.schoolId,
    );
  }

  @Get('student/:studentId')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher', 'parent')
  @ApiOperation({ summary: 'Get student attendance history' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student attendance with summary' })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query() query: AttendanceQueryDto,
    @Req() req: any,
  ) {
    return this.attendanceService.getStudentAttendance(
      studentId,
      query,
      req.user.schoolId,
    );
  }

  @Get('absentees/:date')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({
    summary: 'Get list of absentees for a date (for notifications)',
  })
  @ApiParam({
    name: 'date',
    description: 'Date (YYYY-MM-DD)',
    example: '2025-12-12',
  })
  @ApiQuery({
    name: 'classId',
    required: false,
    description: 'Filter by class',
  })
  @ApiResponse({ status: 200, description: 'List of absent students' })
  getAbsentees(
    @Param('date') date: string,
    @Query('classId') classId: string,
    @Req() req: any,
  ) {
    return this.attendanceService.getAbsentees(
      date,
      req.user.schoolId,
      classId,
    );
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get single attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: 'Attendance record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.findOne(id, req.user.schoolId);
  }

  // ==================== STATISTICS ====================

  @Get('statistics/class/:classId')
  @Roles('super_admin', 'admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Get attendance statistics for a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Class attendance statistics' })
  getClassStatistics(
    @Param('classId') classId: string,
    @Query() query: AttendanceQueryDto,
    @Req() req: any,
  ) {
    return this.attendanceService.getClassStatistics(
      classId,
      query,
      req.user.schoolId,
    );
  }

  @Get('statistics/school')
  @Roles('admin', 'school_admin')
  @ApiOperation({ summary: 'Get school-wide attendance statistics' })
  @ApiResponse({ status: 200, description: 'School attendance statistics' })
  getSchoolStatistics(@Query() query: AttendanceQueryDto, @Req() req: any) {
    return this.attendanceService.getSchoolStatistics(query, req.user.schoolId);
  }

  // ==================== UPDATE & DELETE ====================

  @Patch(':id')
  @Roles('admin', 'school_admin', 'teacher')
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: 'Attendance updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @Req() req: any,
  ) {
    return this.attendanceService.update(id, dto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('admin', 'school_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.remove(id, req.user.schoolId);
  }
}
