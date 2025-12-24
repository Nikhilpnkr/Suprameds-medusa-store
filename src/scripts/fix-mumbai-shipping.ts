import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function fixMumbaiShipping({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const pricingModule = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve("remoteLink")
  const remoteQuery = container.resolve("remoteQuery")

  console.log("🛠️ Fixing Mumbai Shipping...")

  // 1. Get Shipping Option
  const [option] = await fulfillmentModule.listShippingOptions({ name: "Standard Shipping" })
  if (!option) {
      console.error("❌ 'Standard Shipping' option not found. Please run setup first.")
      return
  }
  console.log(`✅ Found Option: ${option.id}`)

  // 2. Force Create & Link New Price Set (Bypass Graph Query issues)
  console.log("ℹ️ Creating new Price Set with EUR, INR, USD...")
  
  const newPriceSet = await pricingModule.createPriceSets({
      prices: [
          { amount: 500, currency_code: "eur" },
          { amount: 500, currency_code: "inr" },
          { amount: 600, currency_code: "usd" }
      ]
  })
  
  // 3. Link it
  await remoteLink.create({
      [Modules.FULFILLMENT]: { shipping_option_id: option.id },
      [Modules.PRICING]: { price_set_id: newPriceSet.id }
  })

  console.log(`✅ Fixed: Standard Shipping linked to new Price Set (${newPriceSet.id}) with USD support.`)
}
