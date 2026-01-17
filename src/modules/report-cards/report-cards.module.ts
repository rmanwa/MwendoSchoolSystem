import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportCardsController } from './report-card.controller';
import { ReportCardsService } from './report-cards.service';

// Entities
import { ReportCard } from '../../database/entities/report-card.entity';
import { Student } from '../../database/entities/student.entity';
import { Class } from '../../database/entities/class.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Exam } from '../../database/entities/exam.entity';
import { Term } from '../../database/entities/term.entity';
import { AcademicYear } from '../../database/entities/academic-year.entity';
import { Attendance } from '../../database/entities/attendance.entity';
import { FeeInvoice } from '../../database/entities/fee-invoice.entity';

/**
 * REPORT CARDS MODULE
 * ===================
 * 
 * This module handles:
 * - Generating report cards from exam grades
 * - Calculating class rankings
 * - Adding teacher/principal comments
 * - Generating PDF report cards
 * - Publishing workflow (draft → approved → published)
 * 
 * Dependencies:
 * - Exams module (for grades)
 * - Attendance module (for attendance summary)
 * - Fees module (for fee balance)
 */

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportCard,
      Student,
      Class,
      Grade,
      Exam,
      Term,
      AcademicYear,
      Attendance,
      FeeInvoice,
    ]),
  ],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}