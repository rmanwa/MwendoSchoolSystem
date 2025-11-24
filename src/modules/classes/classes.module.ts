import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Class } from '../../database/entities/class.entity';
import { Student } from '../../database/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Student])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}