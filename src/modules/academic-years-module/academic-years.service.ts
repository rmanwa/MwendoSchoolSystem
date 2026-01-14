import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../../database/entities/academic-year.entity';
import { Term } from '../../database/entities/term.entity';
import { CreateAcademicYearDto, UpdateAcademicYearDto, AcademicYearStatus } from './dto/academic-year.dto';
import { CreateTermDto, UpdateTermDto, CreateAcademicYearWithTermsDto } from './dto/term.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  // ==================== ACADEMIC YEAR METHODS ====================

  /**
   * Create a new academic year
   */
  async createAcademicYear(dto: CreateAcademicYearDto, schoolId: string): Promise<AcademicYear> {
    // Validate dates
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for duplicate name
    const existing = await this.academicYearRepository.findOne({
      where: { name: dto.name, schoolId },
    });
    if (existing) {
      throw new ConflictException(`Academic year "${dto.name}" already exists`);
    }

    // If setting as current, unset other current years
    if (dto.isCurrent) {
      await this.unsetCurrentYear(schoolId);
    }

    const academicYear = this.academicYearRepository.create({
      ...dto,
      schoolId,
    });

    return this.academicYearRepository.save(academicYear);
  }

  /**
   * Create academic year with terms in one request (Kenyan calendar)
   */
  async createWithTerms(dto: CreateAcademicYearWithTermsDto, schoolId: string): Promise<AcademicYear> {
    // Create the academic year first
    const academicYear = await this.createAcademicYear({
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isCurrent: false,
      status: AcademicYearStatus.UPCOMING,
    }, schoolId);

    // Create each term
    for (const termDto of dto.terms) {
      await this.createTerm({
        ...termDto,
        academicYearId: academicYear.id,
      }, schoolId);
    }

    // Return with terms
    return this.findOneAcademicYear(academicYear.id, schoolId);
  }

  /**
   * Get all academic years for a school
   */
  async findAllAcademicYears(schoolId: string): Promise<AcademicYear[]> {
    return this.academicYearRepository.find({
      where: { schoolId },
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get current academic year
   */
  async findCurrentAcademicYear(schoolId: string): Promise<AcademicYear> {
    const current = await this.academicYearRepository.findOne({
      where: { schoolId, isCurrent: true },
    });

    if (!current) {
      throw new NotFoundException('No current academic year set');
    }

    return current;
  }

  /**
   * Get academic year by ID
   */
  async findOneAcademicYear(id: string, schoolId: string): Promise<AcademicYear> {
    const academicYear = await this.academicYearRepository.findOne({
      where: { id, schoolId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    return academicYear;
  }

  /**
   * Get academic year with all its terms
   */
  async findAcademicYearWithTerms(id: string, schoolId: string): Promise<{ academicYear: AcademicYear; terms: Term[] }> {
    const academicYear = await this.findOneAcademicYear(id, schoolId);
    const terms = await this.termRepository.find({
      where: { academicYearId: id, schoolId },
      order: { termNumber: 'ASC' },
    });

    return { academicYear, terms };
  }

  /**
   * Update academic year
   */
  async updateAcademicYear(id: string, dto: UpdateAcademicYearDto, schoolId: string): Promise<AcademicYear> {
    const academicYear = await this.findOneAcademicYear(id, schoolId);

    // Validate dates if both provided
    const startDate = dto.startDate ? new Date(dto.startDate) : academicYear.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : academicYear.endDate;
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check duplicate name if changing
    if (dto.name && dto.name !== academicYear.name) {
      const existing = await this.academicYearRepository.findOne({
        where: { name: dto.name, schoolId },
      });
      if (existing) {
        throw new ConflictException(`Academic year "${dto.name}" already exists`);
      }
    }

    // If setting as current, unset others
    if (dto.isCurrent && !academicYear.isCurrent) {
      await this.unsetCurrentYear(schoolId);
    }

    Object.assign(academicYear, dto);
    return this.academicYearRepository.save(academicYear);
  }

  /**
   * Set an academic year as current
   */
  async setCurrentYear(id: string, schoolId: string): Promise<AcademicYear> {
    const academicYear = await this.findOneAcademicYear(id, schoolId);
    
    await this.unsetCurrentYear(schoolId);
    
    academicYear.isCurrent = true;
    academicYear.status = 'active';
    return this.academicYearRepository.save(academicYear);
  }

  /**
   * Delete academic year (and its terms)
   */
  async removeAcademicYear(id: string, schoolId: string): Promise<void> {
    const academicYear = await this.findOneAcademicYear(id, schoolId);
    
    // Terms will be deleted by CASCADE
    await this.academicYearRepository.remove(academicYear);
  }

  // ==================== TERM METHODS ====================

  /**
   * Create a new term
   */
  async createTerm(dto: CreateTermDto, schoolId: string): Promise<Term> {
    // Validate academic year exists
    const academicYear = await this.findOneAcademicYear(dto.academicYearId, schoolId);

    // Validate dates
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate term dates within academic year
    if (new Date(dto.startDate) < new Date(academicYear.startDate) ||
        new Date(dto.endDate) > new Date(academicYear.endDate)) {
      throw new BadRequestException('Term dates must be within academic year dates');
    }

    // Check for duplicate term number
    const existing = await this.termRepository.findOne({
      where: { academicYearId: dto.academicYearId, termNumber: dto.termNumber, schoolId },
    });
    if (existing) {
      throw new ConflictException(`Term ${dto.termNumber} already exists for this academic year`);
    }

    // If setting as current, unset other current terms
    if (dto.isCurrent) {
      await this.unsetCurrentTerm(schoolId);
    }

    // Calculate weeks if not provided
    const weeksCount = dto.weeksCount || this.calculateWeeks(dto.startDate, dto.endDate);

    const term = this.termRepository.create({
      ...dto,
      schoolId,
      weeksCount,
    });

    return this.termRepository.save(term);
  }

  /**
   * Get all terms for an academic year
   */
  async findTermsByAcademicYear(academicYearId: string, schoolId: string): Promise<Term[]> {
    return this.termRepository.find({
      where: { academicYearId, schoolId },
      order: { termNumber: 'ASC' },
    });
  }

  /**
   * Get current term
   */
  async findCurrentTerm(schoolId: string): Promise<Term> {
    const current = await this.termRepository.findOne({
      where: { schoolId, isCurrent: true },
      relations: ['academicYear'],
    });

    if (!current) {
      throw new NotFoundException('No current term set');
    }

    return current;
  }

  /**
   * Get term by ID
   */
  async findOneTerm(id: string, schoolId: string): Promise<Term> {
    const term = await this.termRepository.findOne({
      where: { id, schoolId },
      relations: ['academicYear'],
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    return term;
  }

  /**
   * Update term
   */
  async updateTerm(id: string, dto: UpdateTermDto, schoolId: string): Promise<Term> {
    const term = await this.findOneTerm(id, schoolId);

    // Validate dates if provided
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // If setting as current, unset others
    if (dto.isCurrent && !term.isCurrent) {
      await this.unsetCurrentTerm(schoolId);
    }

    // Recalculate weeks if dates changed
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate || term.startDate.toString();
      const endDate = dto.endDate || term.endDate.toString();
      dto.weeksCount = dto.weeksCount || this.calculateWeeks(startDate, endDate);
    }

    Object.assign(term, dto);
    return this.termRepository.save(term);
  }

  /**
   * Set a term as current
   */
  async setCurrentTerm(id: string, schoolId: string): Promise<Term> {
    const term = await this.findOneTerm(id, schoolId);
    
    await this.unsetCurrentTerm(schoolId);
    
    // Also set the academic year as current
    await this.setCurrentYear(term.academicYearId, schoolId);
    
    term.isCurrent = true;
    term.status = 'active';
    return this.termRepository.save(term);
  }

  /**
   * Delete term
   */
  async removeTerm(id: string, schoolId: string): Promise<void> {
    const term = await this.findOneTerm(id, schoolId);
    await this.termRepository.remove(term);
  }

  // ==================== STATISTICS & HELPERS ====================

  /**
   * Get calendar overview
   */
  async getCalendarOverview(schoolId: string): Promise<any> {
    const currentYear = await this.academicYearRepository.findOne({
      where: { schoolId, isCurrent: true },
    });

    const currentTerm = await this.termRepository.findOne({
      where: { schoolId, isCurrent: true },
    });

    const allYears = await this.academicYearRepository.count({ where: { schoolId } });
    
    let termsInCurrentYear = 0;
    let terms: Term[] = [];
    if (currentYear) {
      terms = await this.termRepository.find({
        where: { academicYearId: currentYear.id, schoolId },
        order: { termNumber: 'ASC' },
      });
      termsInCurrentYear = terms.length;
    }

    // Calculate days remaining in current term
    let daysRemaining: number | null = null;
    if (currentTerm) {
      const today = new Date();
      const endDate = new Date(currentTerm.endDate);
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      currentAcademicYear: currentYear || null,
      currentTerm: currentTerm || null,
      termsInCurrentYear: terms,
      statistics: {
        totalAcademicYears: allYears,
        termsInCurrentYear,
        daysRemainingInTerm: daysRemaining,
      },
    };
  }

  /**
   * Seed Kenyan school calendar for a year
   */
  async seedKenyanCalendar(year: number, schoolId: string): Promise<AcademicYear> {
    // Check if already exists
    const existing = await this.academicYearRepository.findOne({
      where: { name: year.toString(), schoolId },
    });
    if (existing) {
      throw new ConflictException(`Academic year ${year} already exists`);
    }

    // Typical Kenyan school calendar
    return this.createWithTerms({
      name: year.toString(),
      startDate: `${year}-01-06`,
      endDate: `${year}-11-29`,
      terms: [
        {
          name: 'Term 1',
          termNumber: 1,
          startDate: `${year}-01-06`,
          endDate: `${year}-04-11`,
          weeksCount: 14,
          midtermBreakStart: `${year}-02-17`,
          midtermBreakEnd: `${year}-02-21`,
        },
        {
          name: 'Term 2',
          termNumber: 2,
          startDate: `${year}-05-05`,
          endDate: `${year}-08-01`,
          weeksCount: 13,
          midtermBreakStart: `${year}-06-09`,
          midtermBreakEnd: `${year}-06-13`,
        },
        {
          name: 'Term 3',
          termNumber: 3,
          startDate: `${year}-08-25`,
          endDate: `${year}-11-29`,
          weeksCount: 14,
          midtermBreakStart: `${year}-10-13`,
          midtermBreakEnd: `${year}-10-17`,
        },
      ],
    }, schoolId);
  }

  // ==================== PRIVATE HELPERS ====================

  private async unsetCurrentYear(schoolId: string): Promise<void> {
    await this.academicYearRepository.update(
      { schoolId, isCurrent: true },
      { isCurrent: false }
    );
  }

  private async unsetCurrentTerm(schoolId: string): Promise<void> {
    await this.termRepository.update(
      { schoolId, isCurrent: true },
      { isCurrent: false }
    );
  }

  private calculateWeeks(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }
}