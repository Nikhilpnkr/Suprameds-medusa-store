
import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Step 1: Create Batch in DB
export const createBatchStep = createStep(
    "create-batch-step",
    async (input: any, { container }) => {
        const pharmaInventoryService = container.resolve("pharma_inventory")
        const batch = await pharmaInventoryService.createProductBatches(input)
        return new StepResponse(batch, batch.id)
    },
    async (batchId, { container }) => {
        const pharmaInventoryService = container.resolve("pharma_inventory")
        await pharmaInventoryService.deleteProductBatches(batchId as any)
    }
)

// Step 2: Sync to Medusa Inventory
export const syncBatchToInventoryStep = createStep(
    "sync-batch-inventory-step",
    async (input: { variant_id: string; quantity: number }, { container }) => {
        const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
        const inventoryService = container.resolve(Modules.INVENTORY)
        const stockLocationService = container.resolve(Modules.STOCK_LOCATION)

        // 1. Find Inventory Item linked to Variant
        const query = {
            entity: "product_variant",
            fields: ["inventory_items.inventory_item_id"],
            filters: { id: input.variant_id }
        }
        
        const { data: variants } = await remoteQuery.graph(query)
        const inventoryItemId = variants[0]?.inventory_items?.[0]?.inventory_item_id

        if (!inventoryItemId) {
            console.warn(`No inventory item found for variant ${input.variant_id}. Batch created but inventory not synced.`)
            return new StepResponse(null)
        }

        // 2. Get Default Location (Assuming single location for MVP)
        const [location] = await stockLocationService.listStockLocations({}, { take: 1 })
        
        if (!location) {
             console.warn(`No stock location found. Inventory not synced.`)
             return new StepResponse(null)
        }

        // 3. Adjust Inventory
        await inventoryService.adjustInventory(
            inventoryItemId,
            location.id,
            input.quantity
        )

        return new StepResponse({ inventoryItemId, locationId: location.id, quantity: input.quantity }, { inventoryItemId, locationId: location.id, quantity: input.quantity })
    },
    async (compensationData, { container }) => {
        if (!compensationData) return

        const inventoryService = container.resolve(Modules.INVENTORY)
        // Revert inventory addition
        await inventoryService.adjustInventory(
            compensationData.inventoryItemId,
            compensationData.locationId,
            -compensationData.quantity
        )
    }
)

export const createBatchWorkflow = createWorkflow(
    "create-batch-workflow",
    (input: any) => {
        const batch = createBatchStep(input)
        
        syncBatchToInventoryStep({
            variant_id: input.variant_id,
            quantity: input.quantity
        })

        return new WorkflowResponse(batch)
    }
)
