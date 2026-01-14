import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeesService } from './fees.service';
import {
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  FeeStructureQueryDto,
  PublicSchoolFeeTemplateDto,
  CreateInvoiceDto,
  BulkInvoiceGenerationDto,
  InvoiceQueryDto,
  FeeStatementRequestDto,
  CreatePaymentDto,
  ReversePaymentDto,
  PaymentQueryDto,
  PaymentReportDto,
  MpesaSTKPushDto,
} from './dto/fees.dto';

@ApiTags('Fees & Payments')
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ============================================
  // REFERENCE DATA & TEMPLATES
  // ============================================

  @Get('templates/public-schools')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Kenya public school fee templates',
    description:
      'Returns all MoE-approved fee structures for National, Extra-County, County, Sub-County schools',
  })
  @ApiResponse({ status: 200, description: 'Public school fee templates' })
  getPublicSchoolTemplates() {
    return this.feesService.getPublicSchoolFeeTemplates();
  }

  @Get('templates/private-schools')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get private school fee ranges',
    description:
      'Returns typical fee ranges for Budget, Mid-range, Premium, and International schools',
  })
  @ApiResponse({ status: 200, description: 'Private school fee ranges' })
  getPrivateSchoolRanges() {
    return this.feesService.getPrivateSchoolFeeRanges();
  }

  @Get('banks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Kenya banks for fee payment' })
  @ApiResponse({
    status: 200,
    description: 'List of Kenya banks with paybill numbers',
  })
  getKenyaBanks() {
    return this.feesService.getKenyaBanks();
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all fee categories (vote heads)' })
  @ApiResponse({ status: 200, description: 'List of fee categories' })
  getFeeCategories() {
    return this.feesService.getFeeCategories();
  }

  @Get('bursary-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get bursary/scholarship types in Kenya' })
  @ApiResponse({ status: 200, description: 'List of bursary types' })
  getBursaryTypes() {
    return this.feesService.getBursaryTypes();
  }

  @Get('discount-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get available discount types' })
  @ApiResponse({ status: 200, description: 'List of discount types' })
  getDiscountTypes() {
    return this.feesService.getDiscountTypes();
  }

  // ============================================
  // FEE STRUCTURE MANAGEMENT
  // ============================================

  @Post('structures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create fee structure',
    description: 'Create a new fee item with amount. Amount is in KES.',
  })
  @ApiResponse({ status: 201, description: 'Fee structure created' })
  createFeeStructure(@Request() req, @Body() dto: CreateFeeStructureDto) {
    return this.feesService.createFeeStructure(
      req.user.schoolId,
      dto,
      req.user.id,
    );
  }

  @Post('structures/from-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create fee structures from public school template',
    description: 'Bulk create fee structures based on MoE-approved templates',
  })
  @ApiResponse({
    status: 201,
    description: 'Fee structures created from template',
  })
  createFromTemplate(@Request() req, @Body() dto: PublicSchoolFeeTemplateDto) {
    return this.feesService.createFromTemplate(
      req.user.schoolId,
      `${dto.schoolCategory}_${dto.schoolType}`,
      dto.academicYearId,
      req.user.id,
    );
  }

  @Get('structures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all fee structures for school' })
  @ApiResponse({ status: 200, description: 'List of fee structures' })
  findAllFeeStructures(@Request() req, @Query() query: FeeStructureQueryDto) {
    return this.feesService.findAllFeeStructures(req.user.schoolId, query);
  }

  @Patch('structures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure updated' })
  updateFeeStructure(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.feesService.updateFeeStructure(req.user.schoolId, id, dto);
  }

  @Delete('structures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure deleted' })
  removeFeeStructure(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.removeFeeStructure(req.user.schoolId, id);
  }

  // ============================================
  // INVOICE MANAGEMENT
  // ============================================

  @Post('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create invoice for a student',
    description: 'Generate fee invoice based on fee structures',
  })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  createInvoice(@Request() req, @Body() dto: CreateInvoiceDto) {
    return this.feesService.createInvoice(req.user.schoolId, dto, req.user.id);
  }

  @Post('invoices/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate invoices for entire class',
    description: 'Bulk generate invoices for all students in a class',
  })
  @ApiResponse({ status: 201, description: 'Invoices generated' })
  bulkGenerateInvoices(@Request() req, @Body() dto: BulkInvoiceGenerationDto) {
    return this.feesService.bulkGenerateInvoices(
      req.user.schoolId,
      dto,
      req.user.id,
    );
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  findAllInvoices(@Request() req, @Query() query: InvoiceQueryDto) {
    return this.feesService.findAllInvoices(req.user.schoolId, query);
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get single invoice' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  findOneInvoice(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.findOneInvoice(req.user.schoolId, id);
  }

  @Patch('invoices/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send invoice to parent' })
  @ApiResponse({ status: 200, description: 'Invoice sent' })
  sendInvoice(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.sendInvoice(req.user.schoolId, id);
  }

  @Patch('invoices/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  cancelInvoice(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.cancelInvoice(req.user.schoolId, id);
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  @Post('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Record a payment',
    description:
      'Record fee payment via M-Pesa, Bank, Cash, Cheque, etc. Amount in KES.',
  })
  @ApiResponse({ status: 201, description: 'Payment recorded' })
  createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.feesService.createPayment(req.user.schoolId, dto, req.user.id);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  findAllPayments(@Request() req, @Query() query: PaymentQueryDto) {
    return this.feesService.findAllPayments(req.user.schoolId, query);
  }

  @Get('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get single payment' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  findOnePayment(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.feesService.findOnePayment(req.user.schoolId, id);
  }

  @Patch('payments/:id/reverse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reverse a payment' })
  @ApiResponse({ status: 200, description: 'Payment reversed' })
  reversePayment(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReversePaymentDto,
  ) {
    return this.feesService.reversePayment(
      req.user.schoolId,
      id,
      dto,
      req.user.id,
    );
  }

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================

  @Get('statement/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get student fee statement',
    description: 'Complete fee statement with all invoices and payments',
  })
  @ApiResponse({ status: 200, description: 'Student fee statement' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  getStudentFeeStatement(
    @Request() req,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: FeeStatementRequestDto,
  ) {
    return this.feesService.getStudentFeeStatement(
      req.user.schoolId,
      studentId,
      query,
    );
  }

  @Get('summary/class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'teacher')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get class fee collection summary',
    description: 'Fee collection status for all students in a class',
  })
  @ApiResponse({ status: 200, description: 'Class fee summary' })
  @ApiQuery({ name: 'termId', required: false })
  getClassFeesSummary(
    @Request() req,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('termId') termId?: string,
  ) {
    return this.feesService.getClassFeesSummary(
      req.user.schoolId,
      classId,
      termId,
    );
  }

  @Get('reports/payment-methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get payment methods breakdown',
    description: 'Breakdown of payments by method (M-Pesa, Bank, Cash, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Payment methods breakdown' })
  getPaymentMethodsBreakdown(@Request() req, @Query() query: PaymentReportDto) {
    return this.feesService.getPaymentMethodsBreakdown(
      req.user.schoolId,
      query,
    );
  }

  @Get('reports/defaulters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get fee defaulters list',
    description: 'Students with outstanding fee balances',
  })
  @ApiResponse({ status: 200, description: 'Defaulters list' })
  @ApiQuery({ name: 'classId', required: false })
  getDefaultersList(@Request() req, @Query('classId') classId?: string) {
    return this.feesService.getDefaultersList(req.user.schoolId, { classId });
  }

  @Get('reports/daily/:date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get daily collection report',
    description: 'All payments collected on a specific date',
  })
  @ApiResponse({ status: 200, description: 'Daily collection report' })
  getDailyCollectionReport(@Request() req, @Param('date') date: string) {
    return this.feesService.getDailyCollectionReport(req.user.schoolId, date);
  }

  @Get('reports/termly/:termId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get termly collection summary',
    description: 'Overall collection statistics for a term',
  })
  @ApiResponse({ status: 200, description: 'Termly collection summary' })
  getTermlyCollectionSummary(
    @Request() req,
    @Param('termId', ParseUUIDPipe) termId: string,
  ) {
    return this.feesService.getTermlyCollectionSummary(req.user.schoolId, termId);
  }
}