import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listRegions({ container }: ExecArgs) {
  const regionService = container.resolve(Modules.REGION)
  
  const regions = await regionService.listRegions({})
  console.log("🌍 Regions:")
  regions.forEach(r => console.log(`- ${r.name} (ID: ${r.id}, Currency: ${r.currency_code})`))
}
