import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { ClassSubject } from '../../database/entities/class-subject.entity';
import { Class } from '../../database/entities/class.entity';
import { Subject } from '../../database/entities/subject.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { 
  CreateClassSubjectDto, 
  BulkAssignSubjectsDto, 
  AutoAssignSubjectsDto 
} from './dto/create-class-subject.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';

@Injectable()
export class ClassSubjectsService {
  constructor(
    @InjectRepository(ClassSubject)
    private readonly classSubjectRepository: Repository<ClassSubject>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  /**
   * Assign a single subject to a class
   */
  async create(dto: CreateClassSubjectDto, schoolId: string): Promise<ClassSubject> {
    // Validate class exists and belongs to school
    const classEntity = await this.classRepository.findOne({
      where: { id: dto.classId, schoolId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Validate subject exists and belongs to school
    const subject = await this.subjectRepository.findOne({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if assignment already exists
    const existing = await this.classSubjectRepository.findOne({
      where: { classId: dto.classId, subjectId: dto.subjectId, schoolId },
    });
    if (existing) {
      throw new ConflictException('Subject is already assigned to this class');
    }

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: dto.teacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    // Validate subject is appropriate for class grade level
    if (classEntity.gradeLevel < subject.gradeLevelStart || 
        classEntity.gradeLevel > subject.gradeLevelEnd) {
      throw new BadRequestException(
        `Subject "${subject.name}" is for grades ${subject.gradeLevelStart}-${subject.gradeLevelEnd}, ` +
        `but class is grade ${classEntity.gradeLevel}`
      );
    }

    const classSubject = this.classSubjectRepository.create({
      ...dto,
      schoolId,
      lessonsPerWeek: dto.lessonsPerWeek || subject.lessonsPerWeek,
    });

    return this.classSubjectRepository.save(classSubject);
  }

  /**
   * Bulk assign multiple subjects to a class
   */
  async bulkAssign(dto: BulkAssignSubjectsDto, schoolId: string): Promise<ClassSubject[]> {
    // Validate class
    const classEntity = await this.classRepository.findOne({
      where: { id: dto.classId, schoolId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Validate all subjects exist
    const subjects = await this.subjectRepository.find({
      where: { id: In(dto.subjectIds), schoolId },
    });
    if (subjects.length !== dto.subjectIds.length) {
      throw new NotFoundException('One or more subjects not found');
    }

    // Get existing assignments
    const existingAssignments = await this.classSubjectRepository.find({
      where: { classId: dto.classId, schoolId },
    });
    const existingSubjectIds = existingAssignments.map(a => a.subjectId);

    // Filter out already assigned subjects
    const newSubjectIds = dto.subjectIds.filter(id => !existingSubjectIds.includes(id));

    if (newSubjectIds.length === 0) {
      return []; // All subjects already assigned
    }

    // Create new assignments
    const newAssignments = newSubjectIds.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      return this.classSubjectRepository.create({
        classId: dto.classId,
        subjectId,
        schoolId,
        lessonsPerWeek: subject?.lessonsPerWeek,
      });
    });

    return this.classSubjectRepository.save(newAssignments);
  }

  /**
   * Auto-assign subjects based on class grade level
   */
  async autoAssign(dto: AutoAssignSubjectsDto, schoolId: string): Promise<ClassSubject[]> {
    // Validate class
    const classEntity = await this.classRepository.findOne({
      where: { id: dto.classId, schoolId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Find subjects matching the grade level
    const queryBuilder = this.subjectRepository
      .createQueryBuilder('subject')
      .where('subject.school_id = :schoolId', { schoolId })
      .andWhere('subject.grade_level_start <= :gradeLevel', { gradeLevel: classEntity.gradeLevel })
      .andWhere('subject.grade_level_end >= :gradeLevel', { gradeLevel: classEntity.gradeLevel })
      .andWhere('subject.is_active = :isActive', { isActive: true });

    if (dto.compulsoryOnly) {
      queryBuilder.andWhere('subject.is_compulsory = :isCompulsory', { isCompulsory: true });
    }

    if (dto.curriculum) {
      queryBuilder.andWhere('subject.curriculum = :curriculum', { curriculum: dto.curriculum });
    }

    const subjects = await queryBuilder.getMany();

    if (subjects.length === 0) {
      return [];
    }

    // Get existing assignments
    const existingAssignments = await this.classSubjectRepository.find({
      where: { classId: dto.classId, schoolId },
    });
    const existingSubjectIds = existingAssignments.map(a => a.subjectId);

    // Filter out already assigned subjects
    const newSubjects = subjects.filter(s => !existingSubjectIds.includes(s.id));

    if (newSubjects.length === 0) {
      return [];
    }

    // Create new assignments
    const newAssignments = newSubjects.map(subject =>
      this.classSubjectRepository.create({
        classId: dto.classId,
        subjectId: subject.id,
        schoolId,
        lessonsPerWeek: subject.lessonsPerWeek,
      })
    );

    return this.classSubjectRepository.save(newAssignments);
  }

  /**
   * Get all subject assignments for a class
   */
  async findByClass(classId: string, schoolId: string): Promise<ClassSubject[]> {
    return this.classSubjectRepository.find({
      where: { classId, schoolId },
      relations: ['subject', 'teacher', 'teacher.user'],
      order: { subject: { category: 'ASC', name: 'ASC' } },
    });
  }

  /**
   * Get all class assignments for a subject
   */
  async findBySubject(subjectId: string, schoolId: string): Promise<ClassSubject[]> {
    return this.classSubjectRepository.find({
      where: { subjectId, schoolId },
      relations: ['class', 'teacher', 'teacher.user'],
      order: { class: { gradeLevel: 'ASC', name: 'ASC' } },
    });
  }

  /**
   * Get all assignments for a teacher
   */
  async findByTeacher(teacherId: string, schoolId: string): Promise<ClassSubject[]> {
    return this.classSubjectRepository.find({
      where: { teacherId, schoolId, isActive: true },
      relations: ['class', 'subject'],
      order: { class: { gradeLevel: 'ASC', name: 'ASC' } },
    });
  }

  /**
   * Get a single assignment by ID
   */
  async findOne(id: string, schoolId: string): Promise<ClassSubject> {
    const assignment = await this.classSubjectRepository.findOne({
      where: { id, schoolId },
      relations: ['class', 'subject', 'teacher', 'teacher.user'],
    });

    if (!assignment) {
      throw new NotFoundException('Class-Subject assignment not found');
    }

    return assignment;
  }

  /**
   * Update an assignment
   */
  async update(id: string, dto: UpdateClassSubjectDto, schoolId: string): Promise<ClassSubject> {
    const assignment = await this.findOne(id, schoolId);

    // Validate teacher if being updated
    if (dto.teacherId) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: dto.teacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    Object.assign(assignment, dto);
    return this.classSubjectRepository.save(assignment);
  }

  /**
   * Assign a teacher to a class-subject
   */
  async assignTeacher(id: string, teacherId: string, schoolId: string): Promise<ClassSubject> {
    const assignment = await this.findOne(id, schoolId);

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, schoolId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    assignment.teacherId = teacherId;
    return this.classSubjectRepository.save(assignment);
  }

  /**
   * Remove teacher from a class-subject
   */
  async unassignTeacher(id: string, schoolId: string): Promise<ClassSubject> {
    const assignment = await this.findOne(id, schoolId);
    assignment.teacherId = null as any;
    return this.classSubjectRepository.save(assignment);
  }

  /**
   * Remove a subject assignment from a class
   */
  async remove(id: string, schoolId: string): Promise<void> {
    const assignment = await this.findOne(id, schoolId);
    await this.classSubjectRepository.remove(assignment);
  }

  /**
   * Remove all subject assignments for a class
   */
  async removeAllForClass(classId: string, schoolId: string): Promise<void> {
    await this.classSubjectRepository.delete({ classId, schoolId });
  }

  /**
   * Get statistics for class-subject assignments
   */
  async getStatistics(schoolId: string): Promise<any> {
    const totalAssignments = await this.classSubjectRepository.count({
      where: { schoolId },
    });

    const assignmentsWithTeacher = await this.classSubjectRepository.count({
      where: { schoolId, teacherId: Not(IsNull()) },
    });

    const assignmentsWithoutTeacher = totalAssignments - assignmentsWithTeacher;

    // Get classes without subjects
    const allClasses = await this.classRepository.count({ where: { schoolId } });
    const classesWithSubjectsResult = await this.classSubjectRepository
      .createQueryBuilder('cs')
      .select('COUNT(DISTINCT cs.class_id)', 'count')
      .where('cs.school_id = :schoolId', { schoolId })
      .getRawOne();
    
    const classesWithSubjects = parseInt(classesWithSubjectsResult?.count || '0');

    return {
      totalAssignments,
      assignmentsWithTeacher,
      assignmentsWithoutTeacher,
      totalClasses: allClasses,
      classesWithSubjects,
      classesWithoutSubjects: allClasses - classesWithSubjects,
    };
  }

  /**
   * Copy subject assignments from one class to another
   */
  async copyAssignments(
    sourceClassId: string,
    targetClassId: string,
    schoolId: string,
  ): Promise<ClassSubject[]> {
    // Validate both classes exist
    const sourceClass = await this.classRepository.findOne({
      where: { id: sourceClassId, schoolId },
    });
    if (!sourceClass) {
      throw new NotFoundException('Source class not found');
    }

    const targetClass = await this.classRepository.findOne({
      where: { id: targetClassId, schoolId },
    });
    if (!targetClass) {
      throw new NotFoundException('Target class not found');
    }

    // Get source assignments
    const sourceAssignments = await this.classSubjectRepository.find({
      where: { classId: sourceClassId, schoolId },
    });

    if (sourceAssignments.length === 0) {
      return [];
    }

    // Get existing target assignments
    const existingTargetAssignments = await this.classSubjectRepository.find({
      where: { classId: targetClassId, schoolId },
    });
    const existingSubjectIds = existingTargetAssignments.map(a => a.subjectId);

    // Create new assignments for target class (excluding existing)
    const newAssignments = sourceAssignments
      .filter(sa => !existingSubjectIds.includes(sa.subjectId))
      .map(sa =>
        this.classSubjectRepository.create({
          classId: targetClassId,
          subjectId: sa.subjectId,
          schoolId,
          lessonsPerWeek: sa.lessonsPerWeek,
          schedulePreference: sa.schedulePreference,
          // Don't copy teacher - they might be different for target class
        })
      );

    if (newAssignments.length === 0) {
      return [];
    }

    return this.classSubjectRepository.save(newAssignments);
  }
}