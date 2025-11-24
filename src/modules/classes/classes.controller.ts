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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  create(@Body() createClassDto: CreateClassDto, @Request() req) {
    return this.classesService.create(createClassDto, req.user.schoolId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  /*findAll(@Request() req, @Query('status') status?: string) {
    if (status) {
      return this.classesService.findByStatus(req.user.schoolId, status);
    }
    return this.classesService.findAll(req.user.schoolId);
  }*/
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'archived'],
    description: 'Filter by Status (optional)',
  })
  @Get(':id')
  @ApiOperation({ summary: 'Get a class by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.classesService.findOne(id, req.user.schoolId);
  }

  @Get(':id/roster')
  @ApiOperation({ summary: 'Get class roster' })
  getClassRoster(@Param('id') id: string, @Request() req) {
    return this.classesService.getClassRoster(id, req.user.schoolId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get class statistics' })
  getClassStats(@Param('id') id: string, @Request() req) {
    return this.classesService.getClassStats(id, req.user.schoolId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class' })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req,
  ) {
    return this.classesService.update(id, updateClassDto, req.user.schoolId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a class' })
  remove(@Param('id') id: string, @Request() req) {
    return this.classesService.remove(id, req.user.schoolId);
  }
}