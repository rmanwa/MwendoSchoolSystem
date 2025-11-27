import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../database/entities/student.entity';
import { User } from '../../database/entities/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { Role } from '../../common/constants/roles.constant';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { Class } from 'src/database/entities';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(createStudentDto: CreateStudentDto, schoolId: string) {
    const { email, admissionNumber, password, ...studentData } =
      createStudentDto;

    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingAdmission = await this.studentRepository.findOne({
      where: {
        admissionNumber,
        schoolId,
      },
    });

    if (existingAdmission) {
      throw new ConflictException(
        'Admission number already exists in your school',
      );
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash(`Student${admissionNumber}!`, 10);

    const user = this.userRepository.create({
      schoolId,
      email,
      password: hashedPassword,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      middleName: studentData.middleName,
      phone: studentData.phone,
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: false,
    });

    await this.userRepository.save(user);

    const student = this.studentRepository.create({
      ...studentData,
      admissionNumber,
      schoolId,
      userId: user.id,
      status: studentData.status || 'active',
    });

    await this.studentRepository.save(student);

    const { password: _, ...userResponse } = user;
    return {
      message: 'Student created successfully',
      student: {
        ...student,
        user: userResponse,
      },
    };
  }

  async findAll(query: QueryStudentDto, schoolId: string) {
    const { search, status, classId, page = 1, limit = 10 } = query;

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.class', 'class')
      .where('student.schoolId = :schoolId', { schoolId });

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR student.admissionNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('student.status = :status', { status });
    }

    if (classId) {
      queryBuilder.andWhere('student.classId = :classId', { classId });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('student.admissionNumber', 'ASC');

    const [students, total] = await queryBuilder.getManyAndCount();

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, schoolId: string) {
    const student = await this.studentRepository.findOne({
      where: {
        id,
        schoolId,
      },
      relations: ['user', 'class', 'school'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    schoolId: string,
  ) {
    const student = await this.findOne(id, schoolId);

    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      ...studentData
    } = updateStudentDto;

    if (
      email ||
      password ||
      firstName ||
      lastName ||
      middleName !== undefined ||
      phone !== undefined
    ) {
      const user = await this.userRepository.findOne({
        where: { id: student.userId },
      });

      if (!user) {
        throw new NotFoundException('User account not found');
      }

      if (email && email !== user.email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email },
        });

        if (existingEmail) {
          throw new ConflictException('Email already registered');
        }

        user.email = email;
      }

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      if (firstName) {
        user.firstName = firstName;
      }

      if (lastName) {
        user.lastName = lastName;
      }

      if (middleName !== undefined) {
        user.middleName = middleName;
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      await this.userRepository.save(user);
    }

    Object.assign(student, studentData);
    await this.studentRepository.save(student);

    return {
      message: 'Student updated successfully',
      student,
    };
  }

  async remove(id: string, schoolId: string) {
    const student = await this.findOne(id, schoolId);

    await this.studentRepository.softDelete(id);
    await this.userRepository.update(student.userId, { isActive: false });

    return {
      message: 'Student deleted successfully',
    };
  }
  /**
   * Import students from CSV file
   */
  async importFromCSV(file: Express.Multer.File, schoolId: string) {
    const results: any[] = [];
    
    // Parse CSV
    const stream = Readable.from(file.buffer);
    
    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row: any) => results.push(row))
        .on('end', async () => {
          const imported: any[] = [];
          const failed: any[] = [];
          
          for (const [index, row] of results.entries()) {
            try {
              // Find class by name if className provided
              let classId = row.classId;
              if (row.className && !classId) {
                const classEntity = await this.classRepository.findOne({
                  where: { name: row.className, schoolId },
                });
                classId = classEntity?.id;
              }
              
              // Create student
              const studentDto: CreateStudentDto = {
                email: row.email,
                admissionNumber: row.admissionNumber,
                firstName: row.firstName,
                lastName: row.lastName,
                middleName: row.middleName || undefined,
                dateOfBirth: row.dateOfBirth,
                gender: row.gender,
                phone: row.phone || undefined,
                address: row.address || undefined,
                admissionDate: row.admissionDate,
                classId: classId || undefined,
                status: row.status || 'active',
                password: row.password || 'Student123',
              };
              
              const student = await this.create(studentDto, schoolId);
              
              imported.push({
                row: index + 2, // +2 for header and 0-indexing
                admissionNumber: row.admissionNumber,
                name: `${row.firstName} ${row.lastName}`,
                status: 'success',
              });
              
            } catch (error: any) {
              failed.push({
                row: index + 2,
                admissionNumber: row.admissionNumber || 'N/A',
                name: `${row.firstName || ''} ${row.lastName || ''}`,
                error: error.message,
              });
            }
          }
          
          resolve({
            total: results.length,
            imported: imported.length,
            failed: failed.length,
            successList: imported,
            errorList: failed,
          });
        })
        .on('error', reject);
    });
  }
}
