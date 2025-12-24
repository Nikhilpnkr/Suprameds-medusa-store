
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const pharmaInventoryService = req.scope.resolve("pharma_inventory")
    
    // Update
    const batch = await pharmaInventoryService.updateProductBatches({
        id,
        ...req.body as any
    })
    
    res.json({ batch })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const pharmaInventoryService = req.scope.resolve("pharma_inventory")
    
    await pharmaInventoryService.deleteProductBatches(id)
    
    res.json({ id, object: "batch", deleted: true })
}
