
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
// import { allocateBatchStockWorkflow } from "../workflows/pharma-inventory/allocate-batch-stock-workflow" 

export default async function pharmaOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const pharmaInventoryService = container.resolve("pharma_inventory")

  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items"]
  })

  if (!order.items) return
  
  for (const item of order.items) {
    if (!item.variant_id) continue

    // We need to deduct item.quantity from batches
    // 1. Get Batches for this variant, sorted by expiry ASC
    // 2. Loop and deduct
    
    // We'll implement this logic directly here or in a service method
    // Service method is cleaner: pharmaInventoryService.allocateStock(variant_id, qty)
    
    await pharmaInventoryService.allocateStock(item.variant_id, item.quantity)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
