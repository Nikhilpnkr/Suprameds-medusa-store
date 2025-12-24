import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251205085623 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "prescription" ("id" text not null, "customer_id" text not null, "image_url" text not null, "doctor_name" text null, "patient_name" text null, "status" text check ("status" in ('PENDING', 'APPROVED', 'REJECTED')) not null default 'PENDING', "rejection_reason" text null, "verified_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "prescription_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_prescription_deleted_at" ON "prescription" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "prescription" cascade;`);
  }

}
