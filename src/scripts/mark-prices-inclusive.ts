// Script to mark all existing prices as tax‑inclusive (MRP)
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pricingModule = req.scope.resolve(ContainerRegistrationKeys.PRICING_MODULE)

  // fetch all price sets (you can filter by region if needed)
  const { data: priceSets } = await pricingModule.listPriceSets({})

  for (const ps of priceSets) {
    // update every price belonging to this price set
    await pricingModule.updatePrices({
      selector: { price_set_id: ps.id },
      update: { includes_tax: true },
    })
  }

  res.json({ updated: priceSets.length })
}

// Default export for `medusa exec`
export default async (container: any) => {
  const req: any = { scope: container }
  const res: any = { json: (obj: any) => console.log(JSON.stringify(obj, null, 2)) }
  await POST(req, res)
}
