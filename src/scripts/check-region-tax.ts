
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkRegionTax({ container }: ExecArgs) {
  const regionService = container.resolve(Modules.REGION)
  const taxModule = container.resolve(Modules.TAX)

  console.log("🔍 Checking Region Tax Settings...")

  // 1. Get India Region
  const [region] = await regionService.listRegions({ name: "India" })
  
  if (!region) {
      console.log("❌ Region 'India' not found.")
      return
  }

  // 2. Safe Log
  console.log(`✅ Found Region: ${region.name} (${region.id})`)
  console.log(`- Currency: ${region.currency_code}`)
  console.log(`- Automatic Taxes: ${region.automatic_taxes}`)
  // Log all keys to see if includes_tax exists
  console.log("🔑 Region Keys:", Object.keys(region))
  
  // 3. Check Tax Rates
  try {
      const taxRates = await taxModule.listTaxRates({ 
          tax_region_id: region.id 
      })
      if (taxRates.length > 0) {
          console.log(`ℹ️ Found ${taxRates.length} Tax Rates:`)
          taxRates.forEach(r => console.log(`- ${r.name}: ${r.rate}% (Code: ${r.code})`))
      } else {
          console.log("⚠️ No Tax Rates found for this region's ID.")
      }
  } catch (e) {
      console.log("⚠️ Could not list tax rates (ID mismatch likely).")
  }
}
