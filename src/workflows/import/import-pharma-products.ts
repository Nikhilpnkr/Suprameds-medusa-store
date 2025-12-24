
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { createPharmaProductsBulkStep } from "./steps/create-pharma-products-bulk"
import { transform } from "@medusajs/framework/workflows-sdk"

export type ImportPharmaInput = {
    products: {
        title: string
        options: { title: string; values: string[] }[]
        variants: {
            title: string
            sku: string
            prices: { currency_code: string; amount: number }[]
            options: Record<string, string>
            inventory_quantity?: number
            manage_inventory?: boolean
        }[] // Simplified for CSV usage, usually 1 variant per row for pharma
    }[]
    pharmaData: Record<string, any>[] // Mapped by index? Or passed along?
    // To keep it simple, let's assume index alignment or pass a combined object and split it in transform
}

export const importPharmaProductsWorkflow = createWorkflow(
    "import-pharma-products",
    (input: { data: any[] }) => {
        
        // Split input into Product Input and Pharma Input
        const splitInput = transform(
            { input },
            (data) => {
                const products = data.input.data.map((row) => {
                    const variantTitle = row.pack_size_label || "Default Variant"
                    return {
                        title: row.title,
                        description: row.description,
                        handle: row.handle,
                        status: "published",
                        shipping_profile_id: row.shipping_profile_id,
                        sales_channels: row.sales_channel_id ? [{ id: row.sales_channel_id }] : undefined,
                        options: [{ title: "Pack Size", values: [variantTitle] }],
                        images: row.images ? row.images.split(",").map((url: string) => ({ url: url.trim() })) : [],
                        variants: [{
                            title: variantTitle,
                            sku: row.variant_sku,
                            prices: [
                                { currency_code: "inr", amount: parseFloat(row.price) * 90 } // Approx conversion for realism
                            ],
                            options: { "Pack Size": variantTitle },
                            manage_inventory: true,
                            inventory_quantity: parseInt(row.stock_quantity || "0"),
                        }]
                    }
                })

                const pharma = data.input.data.map((row) => ({
                    // 1. Identification
                    brand_name: row.brand_name,
                    generic_name: row.generic_name,
                    company_name: row.company_name,
                    marketer_name: row.marketer_name,
                    therapeutic_class: row.therapeutic_class,
                    atc_code: row.atc_code,
                    hsn_code: row.hsn_code,

                    // 2. Product Specifics
                    strength: row.strength,
                    strength_unit: row.strength_unit,
                    dosage_form: row.dosage_form,
                    route_of_administration: row.route_of_administration,
                    pack_size_label: row.pack_size_label,
                    pack_type: row.pack_type,
                    net_weight: row.net_weight,
                    net_weight_unit: row.net_weight_unit,

                    // 3. Regulatory
                    is_prescription_required: row.is_prescription_required === "true",
                    is_narcotic: row.is_narcotic === "true",
                    is_psychotropic: row.is_psychotropic === "true",
                    is_habit_forming: row.is_habit_forming === "true",
                    schedule_type: row.schedule_type || "OTC",
                    drug_license_no: row.drug_license_no,
                    fssai_license: row.fssai_license,

                    // 4. Clinical
                    indication: row.indication,
                    contraindication: row.contraindication,
                    mechanism_of_action: row.mechanism_of_action,
                    side_effects_detailed: row.side_effects_detailed,
                    drug_interactions_detailed: row.drug_interactions_detailed,

                    // 5. Safety
                    alcohol_safety: row.alcohol_safety,
                    pregnancy_safety: row.pregnancy_safety,
                    lactation_safety: row.lactation_safety,
                    driving_safety: row.driving_safety,
                    kidney_safety: row.kidney_safety,
                    liver_safety: row.liver_safety,

                    // 6. Storage
                    storage_temperature: row.storage_temperature,
                    storage_instructions: row.storage_instructions,
                    shelf_life_months: row.shelf_life_months ? parseInt(row.shelf_life_months) : null,

                    // Legacy/Compat
                    composition: row.composition || row.generic_name,
                    manufacturer: row.manufacturer || row.company_name,
                    country_of_origin: row.country_of_origin,
                    side_effects: row.side_effects ? row.side_effects.split(",") : [], // Keep for backward compat
                    drug_interactions: row.drug_interactions ? row.drug_interactions.split(",") : []
                }))

                return { products, pharma }
            }
        )

        const createdProducts = createProductsWorkflow.runAsStep({
            input: { products: splitInput.products }
        })

        const pharmaInput = transform(
            { createdProducts, pharma: splitInput.pharma },
            (data) => {
                return data.createdProducts.map((product, index) => ({
                    product_id: product.id,
                    pharma_data: data.pharma[index]
                }))
            }
        )

        createPharmaProductsBulkStep(pharmaInput)

        return new WorkflowResponse(createdProducts)
    }
)
