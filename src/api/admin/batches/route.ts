
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBatchWorkflow } from "../../../workflows/pharma-inventory/create-batch-workflow"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Support filtering by variant_id if passed in query
    // e.g. /admin/batches?variant_id=...
    const filters = { ...req.query }

    const { data: batches, metadata } = await query.graph({
        entity: "product_batch",
        fields: ["*"],
        filters: filters,
    })

    res.json({ batches, count: metadata?.count, offset: metadata?.skip, limit: metadata?.take })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const pharmaInventoryService = req.scope.resolve("pharma_inventory")

    // Expect body: { batch_number, variant_id, expiry_date, quantity, ... }
    const batchData = req.body

    // Use workflow to ensure inventory sync
    // Use workflow to ensure inventory sync

    const { result } = await createBatchWorkflow(req.scope).run({
        input: batchData
    })

    res.json({ batch: result })

}
