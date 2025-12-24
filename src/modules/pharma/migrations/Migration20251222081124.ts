import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251222081124 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pharma_product" ("id" text not null, "brand_name" text null, "generic_name" text null, "company_name" text null, "marketer_name" text null, "therapeutic_class" text null, "atc_code" text null, "hsn_code" text null, "strength" text null, "strength_unit" text null, "dosage_form" text null, "route_of_administration" text null, "pack_size_label" text null, "pack_type" text null, "net_weight" text null, "net_weight_unit" text null, "is_prescription_required" boolean not null default false, "is_narcotic" boolean not null default false, "is_psychotropic" boolean not null default false, "is_habit_forming" boolean not null default false, "schedule_type" text check ("schedule_type" in ('H', 'H1', 'X', 'G', 'OTC')) not null default 'OTC', "drug_license_no" text null, "fssai_license" text null, "indication" text null, "contraindication" text null, "mechanism_of_action" text null, "side_effects_detailed" text null, "drug_interactions_detailed" text null, "alcohol_safety" text null, "pregnancy_safety" text null, "lactation_safety" text null, "driving_safety" text null, "kidney_safety" text null, "liver_safety" text null, "storage_temperature" text null, "storage_instructions" text null, "shelf_life_months" integer null, "composition" text null, "manufacturer" text null, "side_effects" jsonb null, "drug_interactions" jsonb null, "country_of_origin" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pharma_product_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pharma_product_deleted_at" ON "pharma_product" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pharma_product" cascade;`);
  }

}
