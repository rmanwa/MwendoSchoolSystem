import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { School } from '../../database/entities/school.entity';
import { CreateSchoolDto, SubscriptionStatus, SubscriptionTier } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { QuerySchoolDto } from './dto/query-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  /**
   * Create a new school
   */
  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    // Check for duplicate name
    const existingName = await this.schoolRepository.findOne({
      where: { name: createSchoolDto.name },
    });
    if (existingName) {
      throw new ConflictException(`School with name "${createSchoolDto.name}" already exists`);
    }

    // Check for duplicate code
    const existingCode = await this.schoolRepository.findOne({
      where: { code: createSchoolDto.code },
    });
    if (existingCode) {
      throw new ConflictException(`School with code "${createSchoolDto.code}" already exists`);
    }

    // Generate slug from name
    const slug = this.generateSlug(createSchoolDto.name);

    // Check for duplicate slug
    const existingSlug = await this.schoolRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`School slug "${slug}" already exists`);
    }

    // Generate subdomain if not provided
    const subdomain = createSchoolDto.subdomain || slug;

    // Check for duplicate subdomain
    const existingSubdomain = await this.schoolRepository.findOne({
      where: { subdomain },
    });
    if (existingSubdomain) {
      throw new ConflictException(`Subdomain "${subdomain}" already exists`);
    }

    // Set trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const school = this.schoolRepository.create({
      ...createSchoolDto,
      slug,
      subdomain,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });

    return this.schoolRepository.save(school);
  }

  /**
   * Get all schools with filtering and pagination
   */
  async findAll(queryDto: QuerySchoolDto): Promise<{
    data: School[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      schoolType,
      subscriptionTier,
      subscriptionStatus,
      city,
      country,
      isActive,
      isVerified,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.schoolRepository.createQueryBuilder('school');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(school.name ILIKE :search OR school.code ILIKE :search OR school.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply filters
    if (schoolType) {
      queryBuilder.andWhere('school.schoolType = :schoolType', { schoolType });
    }

    if (subscriptionTier) {
      queryBuilder.andWhere('school.subscriptionTier = :subscriptionTier', { subscriptionTier });
    }

    if (subscriptionStatus) {
      queryBuilder.andWhere('school.subscriptionStatus = :subscriptionStatus', { subscriptionStatus });
    }

    if (city) {
      queryBuilder.andWhere('school.city ILIKE :city', { city: `%${city}%` });
    }

    if (country) {
      queryBuilder.andWhere('school.country ILIKE :country', { country: `%${country}%` });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('school.isActive = :isActive', { isActive });
    }

    if (isVerified !== undefined) {
      queryBuilder.andWhere('school.isVerified = :isVerified', { isVerified });
    }

    // Sorting
    const validSortFields = ['name', 'code', 'createdAt', 'updatedAt', 'subscriptionTier'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`school.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a school by ID
   */
  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID "${id}" not found`);
    }

    return school;
  }

  /**
   * Get a school by slug
   */
  async findBySlug(slug: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { slug },
    });

    if (!school) {
      throw new NotFoundException(`School with slug "${slug}" not found`);
    }

    return school;
  }

  /**
   * Get a school by subdomain
   */
  async findBySubdomain(subdomain: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { subdomain },
    });

    if (!school) {
      throw new NotFoundException(`School with subdomain "${subdomain}" not found`);
    }

    return school;
  }

  /**
   * Get a school by code
   */
  async findByCode(code: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { code },
    });

    if (!school) {
      throw new NotFoundException(`School with code "${code}" not found`);
    }

    return school;
  }

  /**
   * Update a school
   */
  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOne(id);

    // Check for duplicate name if being updated
    if (updateSchoolDto.name && updateSchoolDto.name !== school.name) {
      const existingName = await this.schoolRepository.findOne({
        where: { name: updateSchoolDto.name },
      });
      if (existingName) {
        throw new ConflictException(`School with name "${updateSchoolDto.name}" already exists`);
      }
    }

    // Check for duplicate code if being updated
    if (updateSchoolDto.code && updateSchoolDto.code !== school.code) {
      const existingCode = await this.schoolRepository.findOne({
        where: { code: updateSchoolDto.code },
      });
      if (existingCode) {
        throw new ConflictException(`School with code "${updateSchoolDto.code}" already exists`);
      }
    }

    // Check for duplicate subdomain if being updated
    if (updateSchoolDto.subdomain && updateSchoolDto.subdomain !== school.subdomain) {
      const existingSubdomain = await this.schoolRepository.findOne({
        where: { subdomain: updateSchoolDto.subdomain },
      });
      if (existingSubdomain) {
        throw new ConflictException(`Subdomain "${updateSchoolDto.subdomain}" already exists`);
      }
    }

    Object.assign(school, updateSchoolDto);
    return this.schoolRepository.save(school);
  }

  /**
   * Delete a school (soft delete by deactivating)
   */
  async remove(id: string): Promise<{ message: string }> {
    const school = await this.findOne(id);
    
    // Soft delete - just deactivate
    school.isActive = false;
    await this.schoolRepository.save(school);

    return { message: `School "${school.name}" has been deactivated` };
  }

  /**
   * Hard delete a school (admin only, use with caution)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    const school = await this.findOne(id);
    await this.schoolRepository.remove(school);
    return { message: `School "${school.name}" has been permanently deleted` };
  }

  /**
   * Activate a school
   */
  async activate(id: string): Promise<School> {
    const school = await this.findOne(id);
    school.isActive = true;
    return this.schoolRepository.save(school);
  }

  /**
   * Verify a school
   */
  async verify(id: string): Promise<School> {
    const school = await this.findOne(id);
    school.isVerified = true;
    return this.schoolRepository.save(school);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    tier: SubscriptionTier,
    durationMonths: number = 12,
  ): Promise<School> {
    const school = await this.findOne(id);

    const now = new Date();
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + durationMonths);

    // Set limits based on tier
    const tierLimits = {
      [SubscriptionTier.TRIAL]: { maxStudents: 50, maxTeachers: 5, maxStorageGB: 1 },
      [SubscriptionTier.STARTER]: { maxStudents: 300, maxTeachers: 30, maxStorageGB: 10 },
      [SubscriptionTier.PRO]: { maxStudents: 1000, maxTeachers: 100, maxStorageGB: 50 },
      [SubscriptionTier.ENTERPRISE]: { maxStudents: 10000, maxTeachers: 1000, maxStorageGB: 500 },
    };

    const limits = tierLimits[tier];

    school.subscriptionTier = tier;
    school.subscriptionStatus = SubscriptionStatus.ACTIVE;
    school.subscriptionStartsAt = now;
    school.subscriptionEndsAt = subscriptionEndsAt;
    school.maxStudents = limits.maxStudents;
    school.maxTeachers = limits.maxTeachers;
    school.maxStorageGB = limits.maxStorageGB;

    return this.schoolRepository.save(school);
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(id: string): Promise<School> {
    const school = await this.findOne(id);
    school.onboardingCompleted = true;
    return this.schoolRepository.save(school);
  }

  /**
   * Get school statistics
   */
  async getStatistics(): Promise<any> {
    const total = await this.schoolRepository.count();
    const active = await this.schoolRepository.count({ where: { isActive: true } });
    const verified = await this.schoolRepository.count({ where: { isVerified: true } });

    const byType = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.schoolType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('school.schoolType')
      .getRawMany();

    const byTier = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.subscriptionTier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .groupBy('school.subscriptionTier')
      .getRawMany();

    const byStatus = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.subscriptionStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('school.subscriptionStatus')
      .getRawMany();

    const byCountry = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('school.country IS NOT NULL')
      .groupBy('school.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: parseInt(item.count) }), {}),
      byTier: byTier.reduce((acc, item) => ({ ...acc, [item.tier]: parseInt(item.count) }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: parseInt(item.count) }), {}),
      topCountries: byCountry,
    };
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}