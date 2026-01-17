import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { ReportCardsService } from './report-cards.service';
import {
  GenerateReportCardDto,
  BulkGenerateReportCardsDto,
  UpdateReportCardCommentsDto,
  ReportCardQueryDto,
} from './dto/report-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Report Cards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  // ==================== GENERATION ====================

  @Post('generate')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({
    summary: 'Generate report card for a student',
    description: 'Generates a report card from exam grades for a specific term',
  })
  @ApiResponse({ status: 201, description: 'Report card generated' })
  @ApiResponse({ status: 409, description: 'Report card already exists' })
  generateReportCard(@Body() dto: GenerateReportCardDto, @Req() req: any) {
    return this.reportCardsService.generateReportCard(dto, req.user.schoolId, req.user.id);
  }

  @Post('generate/bulk')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Bulk generate report cards for entire class',
    description: 'Generates report cards for all students in a class',
  })
  @ApiResponse({ status: 201, description: 'Report cards generated' })
  bulkGenerateReportCards(@Body() dto: BulkGenerateReportCardsDto, @Req() req: any) {
    return this.reportCardsService.bulkGenerateReportCards(dto, req.user.schoolId, req.user.id);
  }

  // ==================== CRUD ====================

  @Get()
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({ summary: 'Get all report cards with filters' })
  @ApiResponse({ status: 200, description: 'List of report cards' })
  findAll(@Query() query: ReportCardQueryDto, @Req() req: any) {
    return this.reportCardsService.findAll(query, req.user.schoolId);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'teacher', 'student', 'parent')
  @ApiOperation({ summary: 'Get single report card' })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Report card details' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.reportCardsService.findOne(id, req.user.schoolId);
  }

  @Patch(':id/comments')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({
    summary: 'Update report card comments',
    description: 'Add class teacher or principal comments',
  })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Comments updated' })
  updateComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportCardCommentsDto,
    @Req() req: any,
  ) {
    return this.reportCardsService.updateComments(id, dto, req.user.schoolId, req.user.id);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete report card' })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.reportCardsService.remove(id, req.user.schoolId);
  }

  // ==================== WORKFLOW ====================

  @Patch(':id/approve')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Approve report card',
    description: 'Principal approves report card before publishing',
  })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Report card approved' })
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.reportCardsService.approve(id, req.user.schoolId, req.user.id);
  }

  @Patch(':id/publish')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Publish report card',
    description: 'Make report card visible to parents/students',
  })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Report card published' })
  publish(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.reportCardsService.publish(id, req.user.schoolId);
  }

  @Patch('publish/bulk')
  @Roles('super_admin', 'admin')
  @ApiOperation({
    summary: 'Bulk publish report cards',
    description: 'Publish all approved report cards for a class',
  })
  @ApiQuery({ name: 'classId', required: true, description: 'Class ID' })
  @ApiQuery({ name: 'termId', required: true, description: 'Term ID' })
  @ApiResponse({ status: 200, description: 'Report cards published' })
  bulkPublish(
    @Query('classId', ParseUUIDPipe) classId: string,
    @Query('termId', ParseUUIDPipe) termId: string,
    @Req() req: any,
  ) {
    return this.reportCardsService.bulkPublish(classId, termId, req.user.schoolId);
  }

  // ==================== PDF ====================

  @Get(':id/pdf')
  @Roles('super_admin', 'admin', 'teacher', 'student', 'parent')
  @ApiOperation({
    summary: 'Download report card as PDF',
    description: 'Generates and downloads a PDF version of the report card',
  })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'PDF file', content: { 'application/pdf': {} } })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportCardsService.generatePdf(id, req.user.schoolId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-card-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}