import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { FeeStructure } from '../../database/entities/fee-structure.entity';
import { FeeInvoice } from '../../database/entities/fee-invoice.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Student } from '../../database/entities/student.entity';
import { Class } from '../../database/entities/class.entity';
import { Term } from '../../database/entities/term.entity';
import { AcademicYear } from '../../database/entities/academic-year.entity';
import { AuthModule } from '../auth/auth.module';  // ← ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructure,
      FeeInvoice,
      Payment,
      Student,
      Class,
      Term,
      AcademicYear,
    ]),
    AuthModule,  // ← ADD THIS
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}