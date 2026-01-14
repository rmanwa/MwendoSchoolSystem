import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSubjectsService } from './class-subjects.service';
import { ClassSubjectsController } from './class-subjects.controller';
import { ClassSubject } from '../../database/entities/class-subject.entity';
import { Class } from '../../database/entities/class.entity';
import { Subject } from '../../database/entities/subject.entity';
import { Teacher } from '../../database/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassSubject, Class, Subject, Teacher]),
  ],
  controllers: [ClassSubjectsController],
  providers: [ClassSubjectsService],
  exports: [ClassSubjectsService],
})
export class ClassSubjectsModule {}