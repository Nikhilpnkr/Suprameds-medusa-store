import { model } from "@medusajs/framework/utils"

export const ProductBatch = model.define("product_batch", {
    id: model.id().primaryKey(),
    batch_number: model.text(),
    variant_id: model.text(), // We track batches per product variant
    expiry_date: model.dateTime(),
    quantity: model.number().default(0),
    manufacturing_date: model.dateTime().nullable(),
    // We can add a barcode/EAN per batch if needed
    barcode: model.text().nullable(),
})
