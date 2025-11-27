import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from '../../database/entities/student.entity';
import { User } from '../../database/entities/user.entity';
import { Class } from 'src/database/entities';
@Module({
  imports: [TypeOrmModule.forFeature([Student, User, Class])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}