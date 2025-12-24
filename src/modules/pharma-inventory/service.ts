import { MedusaService } from "@medusajs/framework/utils"
import { ProductBatch } from "./models/product-batch"

class PharmaInventoryService extends MedusaService({
    ProductBatch,
}) { 
    async allocateStock(variantId: string, quantity: number) {
        // 1. Get batches sorted by expiry (FEFO)
        const batches = await this.listProductBatches(
            { variant_id: variantId, quantity: { $gt: 0 } },
            { order: { expiry_date: "ASC" } }
        )

        let remaining = quantity

        for (const batch of batches) {
            if (remaining <= 0) break

            const take = Math.min(batch.quantity, remaining)
            
            await this.updateProductBatches({
                id: batch.id,
                quantity: batch.quantity - take
            })

            remaining -= take
            
            console.log(`[Pharma] Allocated ${take} from Batch ${batch.batch_number} (Exp: ${batch.expiry_date})`)
        }

        if (remaining > 0) {
            console.warn(`[Pharma] Partial allocation! Could not allocate ${remaining} for variant ${variantId}`)
        }
    }
}

export default PharmaInventoryService
