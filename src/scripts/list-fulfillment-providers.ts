import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listFulfillmentProviders({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  const providers = await fulfillmentModule.listFulfillmentProviders({})
  console.log("🚚 Fulfillment Providers:")
  providers.forEach(p => console.log(`- Name: ${p.name}, ID: ${p.id}`))
}
