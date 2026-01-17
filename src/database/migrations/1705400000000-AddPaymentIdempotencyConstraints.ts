import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CRITICAL MIGRATION: Payment Idempotency Constraints
 * ====================================================
 * 
 * This migration adds unique constraints required for payment idempotency.
 * Without these, duplicate payments can occur under concurrent requests.
 * 
 * Constraints added:
 * 1. (school_id, mpesa_receipt_number) - Prevents duplicate M-Pesa payments
 * 2. (school_id, transaction_reference) - Prevents duplicate bank transfers
 * 3. (school_id, cheque_number) - Prevents duplicate cheque payments
 * 4. (school_id, receipt_number) - Ensures unique receipt numbers per school
 * 5. (school_id, invoice_number) - Ensures unique invoice numbers per school
 * 
 * WHY PARTIAL INDEXES (WHERE ... IS NOT NULL)?
 * - Not all payments have M-Pesa receipts (e.g., cash payments)
 * - Not all payments have transaction references
 * - Not all payments have cheque numbers
 * - We only want uniqueness when the field IS provided
 * 
 * SAFE TO RUN MULTIPLE TIMES: Uses IF NOT EXISTS
 */
export class AddPaymentIdempotencyConstraints1705400000000 implements MigrationInterface {
  name = 'AddPaymentIdempotencyConstraints1705400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔒 Adding payment idempotency constraints...');

    // 1. M-Pesa Receipt Number - unique per school (partial index)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mpesa_receipt_unique 
      ON payments (school_id, mpesa_receipt_number) 
      WHERE mpesa_receipt_number IS NOT NULL
    `);
    console.log('  ✅ idx_payments_mpesa_receipt_unique created');

    // 2. Transaction Reference - unique per school (partial index)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_ref_unique 
      ON payments (school_id, transaction_reference) 
      WHERE transaction_reference IS NOT NULL
    `);
    console.log('  ✅ idx_payments_transaction_ref_unique created');

    // 3. Cheque Number - unique per school (partial index)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_cheque_unique 
      ON payments (school_id, cheque_number) 
      WHERE cheque_number IS NOT NULL
    `);
    console.log('  ✅ idx_payments_cheque_unique created');

    // 4. Receipt Number - unique per school (full index)
    // Note: receipt_number should never be null, but we scope by school
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt_number_unique 
      ON payments (school_id, receipt_number)
    `);
    console.log('  ✅ idx_payments_receipt_number_unique created');

    // 5. Invoice Number - unique per school (full index)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number_unique 
      ON fee_invoices (school_id, invoice_number)
    `);
    console.log('  ✅ idx_invoices_invoice_number_unique created');

    // 6. Additional performance indexes for common queries
    
    // Payments by date range (for daily reports)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_school_date 
      ON payments (school_id, payment_date DESC)
    `);
    console.log('  ✅ idx_payments_school_date created');

    // Payments by invoice (for invoice detail view)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_invoice 
      ON payments (invoice_id) 
      WHERE invoice_id IS NOT NULL
    `);
    console.log('  ✅ idx_payments_invoice created');

    // Invoices by student (for student statements)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_student 
      ON fee_invoices (school_id, student_id)
    `);
    console.log('  ✅ idx_invoices_student created');

    // Invoices with balance > 0 (for defaulters list)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_defaulters 
      ON fee_invoices (school_id, balance DESC) 
      WHERE balance > 0 AND status NOT IN ('paid', 'cancelled')
    `);
    console.log('  ✅ idx_invoices_defaulters created');

    console.log('🎉 All payment idempotency constraints added successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔓 Removing payment idempotency constraints...');

    // Remove in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_defaulters`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_student`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_invoice`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_school_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_invoice_number_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_receipt_number_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_cheque_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_transaction_ref_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_mpesa_receipt_unique`);

    console.log('✅ All payment idempotency constraints removed');
  }
}