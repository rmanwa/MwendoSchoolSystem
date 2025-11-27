import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto, schoolId: string): Promise<Teacher> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingTeacher = await this.teacherRepository.findOne({
      where: {
        employeeId: createTeacherDto.employeeId,
        schoolId,
      },
    });

    if (existingTeacher) {
      throw new ConflictException('Employee ID already exists');
    }

    const hashedPassword = await bcrypt.hash(createTeacherDto.password, 10);

    const user = this.userRepository.create({
      email: createTeacherDto.email,
      password: hashedPassword,
      firstName: createTeacherDto.firstName,
      lastName: createTeacherDto.lastName,
      middleName: createTeacherDto.middleName,
      phone: createTeacherDto.phone,
      role: 'teacher' as any,
      schoolId,
    });

    const savedUser = await this.userRepository.save(user);

    const teacher = this.teacherRepository.create({
      employeeId: createTeacherDto.employeeId,
      userId: savedUser.id,
      schoolId,
      gender: createTeacherDto.gender,
      joinDate: new Date(createTeacherDto.joinDate),
      employmentType: createTeacherDto.employmentType as any,
      status: createTeacherDto.status as any,
    });

    if (createTeacherDto.dateOfBirth) {
      teacher.dateOfBirth = new Date(createTeacherDto.dateOfBirth);
    }
    if (createTeacherDto.address) teacher.address = createTeacherDto.address;
    if (createTeacherDto.city) teacher.city = createTeacherDto.city;
    if (createTeacherDto.state) teacher.state = createTeacherDto.state;
    if (createTeacherDto.country) teacher.country = createTeacherDto.country;
    if (createTeacherDto.postalCode) teacher.postalCode = createTeacherDto.postalCode;
    if (createTeacherDto.qualification) teacher.qualification = createTeacherDto.qualification;
    if (createTeacherDto.specialization) teacher.specialization = createTeacherDto.specialization;
    if (createTeacherDto.yearsOfExperience !== undefined) {
      teacher.yearsOfExperience = createTeacherDto.yearsOfExperience;
    }
    if (createTeacherDto.salary !== undefined) teacher.salary = createTeacherDto.salary;
    if (createTeacherDto.bankName) teacher.bankName = createTeacherDto.bankName;
    if (createTeacherDto.bankAccountNumber) {
      teacher.bankAccountNumber = createTeacherDto.bankAccountNumber;
    }
    if (createTeacherDto.taxId) teacher.taxId = createTeacherDto.taxId;
    if (createTeacherDto.emergencyContactName) {
      teacher.emergencyContactName = createTeacherDto.emergencyContactName;
    }
    if (createTeacherDto.emergencyContactPhone) {
      teacher.emergencyContactPhone = createTeacherDto.emergencyContactPhone;
    }

    return await this.teacherRepository.save(teacher);
  }

  async findAll(schoolId: string): Promise<Teacher[]> {
    return await this.teacherRepository.find({
      where: { schoolId },
      relations: ['user'],
      order: {
        employeeId: 'ASC',
      },
    });
  }

  async findByStatus(schoolId: string, status: string): Promise<Teacher[]> {
    return await this.teacherRepository.find({
      where: { schoolId, status: status as any },
      relations: ['user'],
      order: {
        employeeId: 'ASC',
      },
    });
  }

  async findOne(id: string, schoolId: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { id, schoolId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(
    id: string,
    updateTeacherDto: UpdateTeacherDto,
    schoolId: string,
  ): Promise<Teacher> {
    const teacher = await this.findOne(id, schoolId);

    if (updateTeacherDto.email && updateTeacherDto.email !== teacher.user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateTeacherDto.email },
      });

      if (existingUser && existingUser.id !== teacher.userId) {
        throw new ConflictException('Email already registered');
      }
    }

    if (
      updateTeacherDto.employeeId &&
      updateTeacherDto.employeeId !== teacher.employeeId
    ) {
      const existingTeacher = await this.teacherRepository.findOne({
        where: {
          employeeId: updateTeacherDto.employeeId,
          schoolId,
        },
      });

      if (existingTeacher && existingTeacher.id !== id) {
        throw new ConflictException('Employee ID already exists');
      }
    }

    if (
      updateTeacherDto.email ||
      updateTeacherDto.firstName ||
      updateTeacherDto.lastName ||
      updateTeacherDto.middleName ||
      updateTeacherDto.phone
    ) {
      const user = await this.userRepository.findOne({
        where: { id: teacher.userId },
      });

      if (user) {
        if (updateTeacherDto.email) user.email = updateTeacherDto.email;
        if (updateTeacherDto.firstName) user.firstName = updateTeacherDto.firstName;
        if (updateTeacherDto.lastName) user.lastName = updateTeacherDto.lastName;
        if (updateTeacherDto.middleName !== undefined) user.middleName = updateTeacherDto.middleName;
        if (updateTeacherDto.phone) user.phone = updateTeacherDto.phone;

        await this.userRepository.save(user);
      }
    }

    if (updateTeacherDto.password) {
      const hashedPassword = await bcrypt.hash(updateTeacherDto.password, 10);
      const user = await this.userRepository.findOne({
        where: { id: teacher.userId },
      });
      if (user) {
        user.password = hashedPassword;
        await this.userRepository.save(user);
      }
    }

    if (updateTeacherDto.employeeId) teacher.employeeId = updateTeacherDto.employeeId;
    if (updateTeacherDto.dateOfBirth) teacher.dateOfBirth = new Date(updateTeacherDto.dateOfBirth);
    if (updateTeacherDto.gender) teacher.gender = updateTeacherDto.gender;
    if (updateTeacherDto.address !== undefined) teacher.address = updateTeacherDto.address;
    if (updateTeacherDto.city !== undefined) teacher.city = updateTeacherDto.city;
    if (updateTeacherDto.state !== undefined) teacher.state = updateTeacherDto.state;
    if (updateTeacherDto.country !== undefined) teacher.country = updateTeacherDto.country;
    if (updateTeacherDto.postalCode !== undefined) teacher.postalCode = updateTeacherDto.postalCode;
    if (updateTeacherDto.qualification !== undefined) teacher.qualification = updateTeacherDto.qualification;
    if (updateTeacherDto.specialization !== undefined) teacher.specialization = updateTeacherDto.specialization;
    if (updateTeacherDto.yearsOfExperience !== undefined) teacher.yearsOfExperience = updateTeacherDto.yearsOfExperience;
    if (updateTeacherDto.joinDate) teacher.joinDate = new Date(updateTeacherDto.joinDate);
    if (updateTeacherDto.employmentType) teacher.employmentType = updateTeacherDto.employmentType as any;
    if (updateTeacherDto.salary !== undefined) teacher.salary = updateTeacherDto.salary;
    if (updateTeacherDto.bankName !== undefined) teacher.bankName = updateTeacherDto.bankName;
    if (updateTeacherDto.bankAccountNumber !== undefined) teacher.bankAccountNumber = updateTeacherDto.bankAccountNumber;
    if (updateTeacherDto.taxId !== undefined) teacher.taxId = updateTeacherDto.taxId;
    if (updateTeacherDto.emergencyContactName !== undefined) teacher.emergencyContactName = updateTeacherDto.emergencyContactName;
    if (updateTeacherDto.emergencyContactPhone !== undefined) teacher.emergencyContactPhone = updateTeacherDto.emergencyContactPhone;
    if (updateTeacherDto.status) teacher.status = updateTeacherDto.status as any;

    return await this.teacherRepository.save(teacher);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const teacher = await this.findOne(id, schoolId);
    await this.teacherRepository.softDelete(id);
    await this.userRepository.softDelete(teacher.userId);
  }

  async getTeacherStats(id: string, schoolId: string) {
    const teacher = await this.findOne(id, schoolId);

    return {
      teacherId: id,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      employeeId: teacher.employeeId,
      specialization: teacher.specialization || 'Not specified',
      yearsOfExperience: teacher.yearsOfExperience || 0,
      qualification: teacher.qualification || 'Not specified',
      status: teacher.status,
      employmentType: teacher.employmentType,
    };
  }
}