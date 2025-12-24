// Script to create a GST tax rate for India region
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const taxModule = req.scope.resolve(ContainerRegistrationKeys.TAX_MODULE)

  const tax = await taxModule.createTaxRates([
    {
      name: "India GST",
      rate: 5, // 5% GST – adjust as needed
      code: "IN_GST",
      is_default: true,
      tax_region_id: "reg_01KD2JC6KK1AH9DKXK5824H266", // India region ID (from earlier script)
    },
  ])

  res.json({ tax })
}

// Default export for `medusa exec`
export default async (container: any) => {
  // Simulate request/response objects
  const req: any = { scope: container }
  const res: any = { json: (obj: any) => console.log(JSON.stringify(obj, null, 2)) }
  await POST(req, res)
}
