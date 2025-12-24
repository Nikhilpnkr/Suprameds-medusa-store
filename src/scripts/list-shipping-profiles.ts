import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listShippingProfiles({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  const profiles = await fulfillmentModule.listShippingProfiles({})
  console.log("📦 Shipping Profiles:")
  profiles.forEach(p => console.log(`- ${p.name} (ID: ${p.id}, Type: ${p.type})`))
}
