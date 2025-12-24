import { model } from "@medusajs/framework/utils"

export const PharmaProduct = model.define("pharma_product", {
    id: model.id().primaryKey(),
    // 1. Identification & Classification
    brand_name: model.text().nullable(),
    generic_name: model.text().nullable(), // Composition implies this, but specific generic name field is good
    company_name: model.text().nullable(),
    marketer_name: model.text().nullable(),
    therapeutic_class: model.text().nullable(),
    atc_code: model.text().nullable(),
    hsn_code: model.text().nullable(),

    // 2. Product Specifics
    strength: model.text().nullable(),
    strength_unit: model.text().nullable(),
    dosage_form: model.text().nullable(),
    route_of_administration: model.text().nullable(),
    pack_size_label: model.text().nullable(),
    pack_type: model.text().nullable(),
    net_weight: model.text().nullable(),
    net_weight_unit: model.text().nullable(),

    // 3. Regulatory & Compliance
    is_prescription_required: model.boolean().default(false),
    is_narcotic: model.boolean().default(false),
    is_psychotropic: model.boolean().default(false),
    is_habit_forming: model.boolean().default(false),
    schedule_type: model.enum(["H", "H1", "X", "G", "OTC"]).default("OTC"),
    drug_license_no: model.text().nullable(),
    fssai_license: model.text().nullable(),

    // 4. Clinical Information
    indication: model.text().nullable(),
    contraindication: model.text().nullable(),
    mechanism_of_action: model.text().nullable(),
    side_effects_detailed: model.text().nullable(), // Full text description
    drug_interactions_detailed: model.text().nullable(), // Full text description

    // 5. Safety Advice (Interaction Flags)
    alcohol_safety: model.text().nullable(), // Safe / Unsafe / Consult Doctor
    pregnancy_safety: model.text().nullable(),
    lactation_safety: model.text().nullable(),
    driving_safety: model.text().nullable(),
    kidney_safety: model.text().nullable(),
    liver_safety: model.text().nullable(),

    // 6. Storage & Handling
    storage_temperature: model.text().nullable(),
    storage_instructions: model.text().nullable(),
    shelf_life_months: model.number().nullable(),

    // Legacy/Duplicate compatibility (keeping for now to avoid breaking existing code immediately, or reusing)
    composition: model.text().nullable(), // Can be same as Generic Name
    manufacturer: model.text().nullable(), // Can be same as Company Name
    side_effects: model.json().nullable(), // Deprecated or kept for list format
    drug_interactions: model.json().nullable(), // Deprecated or kept for list format
    country_of_origin: model.text().nullable(),
})
