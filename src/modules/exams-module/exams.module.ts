import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam } from '../../database/entities/exam.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Student } from '../../database/entities/student.entity';
import { Subject } from '../../database/entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Grade, Student, Subject])],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}