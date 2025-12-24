import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251205090038 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "daily_metric" ("id" text not null, "date" text not null, "total_sales" numeric not null default 0, "active_users" integer not null default 0, "top_products" jsonb null, "raw_total_sales" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "daily_metric_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_daily_metric_deleted_at" ON "daily_metric" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "daily_metric" cascade;`);
  }

}
