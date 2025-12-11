import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Curriculum, SubjectCategory } from '../../database/entities/subject.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ALL_PREDEFINED_SUBJECTS } from './subjects.data';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  /**
   * Create a new subject
   */
  async create(createSubjectDto: CreateSubjectDto, schoolId: string): Promise<Subject> {
    // Validate grade levels
    if (createSubjectDto.gradeLevelStart > createSubjectDto.gradeLevelEnd) {
      throw new BadRequestException('gradeLevelStart cannot be greater than gradeLevelEnd');
    }

    // Check if subject code already exists (if provided)
    if (createSubjectDto.code) {
      const existingSubject = await this.subjectRepository.findOne({
        where: { code: createSubjectDto.code, schoolId },
      });

      if (existingSubject) {
        throw new ConflictException(`Subject with code ${createSubjectDto.code} already exists`);
      }
    }

    // Validate teacher if provided
    if (createSubjectDto.defaultTeacherId) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: createSubjectDto.defaultTeacherId, schoolId },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      schoolId,
    });

    return this.subjectRepository.save(subject);
  }

  /**
   * Get all subjects for a school
   */
  async findAll(schoolId: string, curriculum?: Curriculum): Promise<Subject[]> {
    const query: any = { schoolId };
    
    if (curriculum) {
      query.curriculum = curriculum;
    }

    return this.subjectRepository.find({
      where: query,
      relations: ['defaultTeacher', 'defaultTeacher.user'],
      order: { curriculum: 'ASC', category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get subjects by grade level
   */
  async findByGradeLevel(schoolId: string, gradeLevel: number): Promise<Subject[]> {
    return this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.defaultTeacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .where('subject.schoolId = :schoolId', { schoolId })
      .andWhere('subject.gradeLevelStart <= :gradeLevel', { gradeLevel })
      .andWhere('subject.gradeLevelEnd >= :gradeLevel', { gradeLevel })
      .andWhere('subject.isActive = :isActive', { isActive: true })
      .orderBy('subject.curriculum', 'ASC')
      .addOrderBy('subject.category', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .getMany();
  }

  /**
   * Get subjects by category
   */
  async findByCategory(schoolId: string, category: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { schoolId, category: category as SubjectCategory},
      relations: ['defaultTeacher', 'defaultTeacher.user'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get compulsory subjects
   */
  async findCompulsory(schoolId: string, gradeLevel?: number): Promise<Subject[]> {
    const queryBuilder = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.defaultTeacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .where('subject.schoolId = :schoolId', { schoolId })
      .andWhere('subject.isCompulsory = :isCompulsory', { isCompulsory: true })
      .andWhere('subject.isActive = :isActive', { isActive: true });

    if (gradeLevel) {
      queryBuilder
        .andWhere('subject.gradeLevelStart <= :gradeLevel', { gradeLevel })
        .andWhere('subject.gradeLevelEnd >= :gradeLevel', { gradeLevel });
    }

    return queryBuilder
      .orderBy('subject.curriculum', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .getMany();
  }

  /**
   * Get a single subject by ID
   */
  async findOne(id: string, schoolId: string): Promise<Subject> {
    const subject = await this.subjectRepository.findOne({
      where: { id, schoolId },
      relations: ['defaultTeacher', 'defaultTeacher.user'],
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  /**
   * Update a subject
   */
  async update(id: string, updateSubjectDto: UpdateSubjectDto, schoolId: string): Promise<Subject> {
    const subject = await this.findOne(id, schoolId);

    // Validate grade levels if being updated
    if (updateSubjectDto.gradeLevelStart && updateSubjectDto.gradeLevelEnd) {
      if (updateSubjectDto.gradeLevelStart > updateSubjectDto.gradeLevelEnd) {
        throw new BadRequestException('gradeLevelStart cannot be greater than gradeLevelEnd');
      }
    }

    // Check if new code conflicts (if being updated)
    if (updateSubjectDto.code && updateSubjectDto.code !== subject.code) {
      const existingSubject = await this.subjectRepository.findOne({
        where: { code: updateSubjectDto.code, schoolId },
      });

      if (existingSubject) {
        throw new ConflictException(`Subject with code ${updateSubjectDto.code} already exists`);
      }
    }

    // Validate teacher if being updated
    if (updateSubjectDto.defaultTeacherId) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: updateSubjectDto.defaultTeacherId, schoolId },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    Object.assign(subject, updateSubjectDto);
    return this.subjectRepository.save(subject);
  }

  /**
   * Delete a subject (soft delete)
   */
  async remove(id: string, schoolId: string): Promise<void> {
    const subject = await this.findOne(id, schoolId);
    await this.subjectRepository.softRemove(subject);
  }

  /**
   * Assign a teacher to a subject
   */
  async assignTeacher(subjectId: string, teacherId: string, schoolId: string): Promise<Subject> {
    const subject = await this.findOne(subjectId, schoolId);

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    subject.defaultTeacherId = teacherId;
    return this.subjectRepository.save(subject);
  }

  /**
   * Remove teacher assignment from a subject
   */
  async unassignTeacher(subjectId: string, schoolId: string): Promise<Subject> {
    const subject = await this.findOne(subjectId, schoolId);
    subject.defaultTeacherId = null as any;
    return this.subjectRepository.save(subject);
  }

  /**
   * Seed predefined subjects for a specific curriculum
   */
  async seedPredefinedSubjects(schoolId: string, curriculum: Curriculum): Promise<Subject[]> {
    const predefinedSubjects = ALL_PREDEFINED_SUBJECTS.filter(
      (subject) => subject.curriculum === curriculum
    );

    const createdSubjects: Subject[] = [];

    for (const predefinedSubject of predefinedSubjects) {
      // Check if subject already exists
      const existingSubject = await this.subjectRepository.findOne({
        where: { code: predefinedSubject.code, schoolId },
      });

      if (!existingSubject) {
        const subject = this.subjectRepository.create({
          ...predefinedSubject,
          schoolId,
        });

        const savedSubject = await this.subjectRepository.save(subject);
        createdSubjects.push(savedSubject);
      }
    }

    return createdSubjects;
  }

  /**
   * Get statistics for subjects
   */
  async getStatistics(schoolId: string): Promise<any> {
    const subjects = await this.subjectRepository.find({ where: { schoolId } });

    const stats = {
      total: subjects.length,
      active: subjects.filter(s => s.isActive).length,
      inactive: subjects.filter(s => !s.isActive).length,
      compulsory: subjects.filter(s => s.isCompulsory).length,
      optional: subjects.filter(s => !s.isCompulsory).length,
      withTeacher: subjects.filter(s => s.defaultTeacherId).length,
      withoutTeacher: subjects.filter(s => !s.defaultTeacherId).length,
      byCurriculum: {
        cbc: subjects.filter(s => s.curriculum === Curriculum.CBC).length,
        '8-4-4': subjects.filter(s => s.curriculum === Curriculum.EIGHT_FOUR_FOUR).length,
        cambridge: subjects.filter(s => s.curriculum === Curriculum.CAMBRIDGE).length,
        ib: subjects.filter(s => s.curriculum === Curriculum.IB).length,
        american: subjects.filter(s => s.curriculum === Curriculum.AMERICAN).length,
        custom: subjects.filter(s => s.curriculum === Curriculum.CUSTOM).length,
      },
      byCategory: subjects.reduce((acc, subject) => {
        acc[subject.category] = (acc[subject.category] || 0) + 1;
        return acc;
      }, {}),
    };

    return stats;
  }
}