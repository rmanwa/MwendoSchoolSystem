import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Create Report Cards Table
 * =====================================
 * 
 * This creates the report_cards table to store generated report cards.
 * Report cards are generated from exam grades and include:
 * - Subject results with grades
 * - Class rankings
 * - Teacher/Principal comments
 * - Attendance summary
 * - Fee balance (optional)
 */

export class CreateReportCardsTable1705500000000 implements MigrationInterface {
  name = 'CreateReportCardsTable1705500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📄 Creating report_cards table...');

    // Create enum for report card status
    await queryRunner.query(`
      CREATE TYPE "report_card_status_enum" AS ENUM (
        'draft',
        'pending_review',
        'approved',
        'published',
        'archived'
      )
    `);

    // Create report_cards table
    await queryRunner.query(`
      CREATE TABLE "report_cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "term_id" uuid NOT NULL,
        "report_number" varchar(50),
        "curriculum" varchar(50) NOT NULL DEFAULT '8-4-4',
        "subject_results" jsonb NOT NULL DEFAULT '[]',
        "summary" jsonb,
        "days_present" int NOT NULL DEFAULT 0,
        "days_absent" int NOT NULL DEFAULT 0,
        "total_school_days" int NOT NULL DEFAULT 0,
        "class_teacher_comment" text,
        "class_teacher_id" uuid,
        "principal_comment" text,
        "principal_id" uuid,
        "parent_comment" text,
        "parent_acknowledged_at" timestamp,
        "status" "report_card_status_enum" NOT NULL DEFAULT 'draft',
        "next_term_opens" date,
        "next_term_closes" date,
        "fee_balance" decimal(12,2),
        "pdf_url" text,
        "pdf_generated_at" timestamp,
        "generated_by" uuid,
        "approved_by" uuid,
        "approved_at" timestamp,
        "published_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report_cards" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_report_cards_student_term" UNIQUE ("student_id", "term_id")
      )
    `);
    console.log('  ✅ report_cards table created');

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "report_cards" 
      ADD CONSTRAINT "FK_report_cards_school" 
      FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "report_cards" 
      ADD CONSTRAINT "FK_report_cards_student" 
      FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "report_cards" 
      ADD CONSTRAINT "FK_report_cards_class" 
      FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "report_cards" 
      ADD CONSTRAINT "FK_report_cards_academic_year" 
      FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "report_cards" 
      ADD CONSTRAINT "FK_report_cards_term" 
      FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE SET NULL
    `);
    console.log('  ✅ Foreign keys added');

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "idx_report_cards_school" ON "report_cards" ("school_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_report_cards_school_term" ON "report_cards" ("school_id", "term_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_report_cards_school_class_term" ON "report_cards" ("school_id", "class_id", "term_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_report_cards_school_status" ON "report_cards" ("school_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_report_cards_student" ON "report_cards" ("student_id")
    `);
    console.log('  ✅ Indexes created');

    console.log('🎉 Report cards table created successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🗑️ Dropping report_cards table...');

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_cards_student"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_cards_school_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_cards_school_class_term"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_cards_school_term"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_cards_school"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "report_cards"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "report_card_status_enum"`);

    console.log('✅ Report cards table dropped');
  }
}