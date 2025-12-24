import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugShippingSetup({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const pricingModule = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve("remoteLink")
  
  // 1. List Providers
  const providers = await fulfillmentModule.listFulfillmentProviders({})
  console.log("🚚 Fulfillment Providers:")
  providers.forEach(p => console.log(`- ${p.id}`))

  // 2. List Shipping Options
  const options = await fulfillmentModule.listShippingOptions({ name: "Standard Shipping" })
  console.log("\n📦 Shipping Options:")
  for (const opt of options) {
      console.log(`- Option: ${opt.name} (ID: ${opt.id}, Provider: ${opt.provider_id})`)
      console.log(`  Profile: ${opt.shipping_profile_id}`)
      console.log(`  Price Type: ${opt.price_type}`)
      
      // Check linked prices
      // Trying to find link or price set
      // We can't easily query links here without Link Module query?
      // Actually let's use the Pricing Module query if we can find the link.
      
      // Link: FULFILLMENT: { shipping_option_id: opt.id } -> PRICING: { price_set_id: ... }
      // Using remoteQuery
      const query = container.resolve("remoteQuery")
      
      const { data: priceSets } = await query.graph({
          entity: "shipping_option",
          fields: ["price_set.prices.*"],
          filters: { id: opt.id }
      })
      
      if (priceSets && priceSets.length > 0) {
           console.log("  💰 Prices:", JSON.stringify(priceSets[0].price_set, null, 2))
      } else {
           console.log("  ⚠️ No Price Set found linked!")
      }
  }
}
