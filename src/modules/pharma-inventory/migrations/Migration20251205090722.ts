import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251205090722 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_batch" ("id" text not null, "batch_number" text not null, "variant_id" text not null, "expiry_date" timestamptz not null, "quantity" integer not null default 0, "manufacturing_date" timestamptz null, "barcode" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_batch_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_batch_deleted_at" ON "product_batch" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_batch" cascade;`);
  }

}
