import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../database/entities/class.entity';
import { Student } from '../../database/entities/student.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createClassDto: CreateClassDto, schoolId: string): Promise<Class> {
    const existingClass = await this.classRepository.findOne({
      where: {
        name: createClassDto.name,
        schoolId,
      },
    });

    if (existingClass) {
      throw new ConflictException('Class with this name already exists');
    }

    const newClass = this.classRepository.create({
      ...createClassDto,
      schoolId,
    });

    return await this.classRepository.save(newClass);
  }

  async findAll(schoolId: string): Promise<Class[]> {
    return await this.classRepository.find({
      where: { schoolId },
      order: {
        name: 'ASC',
      },
    });
  }

  async findByStatus(schoolId: string, status: string): Promise<Class[]> {
    return await this.classRepository.find({
      where: { schoolId },
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: string, schoolId: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }

  async update(
    id: string,
    updateClassDto: UpdateClassDto,
    schoolId: string,
  ): Promise<Class> {
    const classEntity = await this.findOne(id, schoolId);

    if (updateClassDto.name && updateClassDto.name !== classEntity.name) {
      const existingClass = await this.classRepository.findOne({
        where: {
          name: updateClassDto.name,
          schoolId,
        },
      });

      if (existingClass && existingClass.id !== id) {
        throw new ConflictException('Class with this name already exists');
      }
    }

    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const classEntity = await this.findOne(id, schoolId);

    const studentCount = await this.studentRepository.count({
      where: { classId: id },
    });

    if (studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete class with ${studentCount} student(s).`,
      );
    }

    await this.classRepository.softDelete(id);
  }

  async getClassRoster(id: string, schoolId: string): Promise<Student[]> {
    await this.findOne(id, schoolId);

    return await this.studentRepository.find({
      where: { classId: id, schoolId },
      order: {
        admissionNumber: 'ASC',
      },
    });
  }

  async getClassStats(id: string, schoolId: string) {
    const classEntity = await this.findOne(id, schoolId);

    const studentCount = await this.studentRepository.count({
      where: { classId: id, schoolId },
    });

    const maleCount = await this.studentRepository.count({
      where: { classId: id, schoolId, gender: 'male' },
    });

    const femaleCount = await this.studentRepository.count({
      where: { classId: id, schoolId, gender: 'female' },
    });

    return {
      classId: id,
      className: classEntity.name,
      totalStudents: studentCount,
      maleStudents: maleCount,
      femaleStudents: femaleCount,
      capacity: classEntity.capacity || 0,
    };
  }
}