import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function resetMumbaiShipping({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  console.log("🗑️ Resetting Mumbai Shipping...")

  const options = await fulfillmentModule.listShippingOptions({ name: "Standard Shipping" })
  
  if (options.length > 0) {
      const ids = options.map(o => o.id)
      await fulfillmentModule.deleteShippingOptions(ids)
      console.log(`✅ Deleted ${ids.length} 'Standard Shipping' option(s).`)
  } else {
      console.log("ℹ️ No 'Standard Shipping' options found to delete.")
  }
}
