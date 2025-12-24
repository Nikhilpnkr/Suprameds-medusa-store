import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugLinks({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")
  
  // Try to query the link entity directly. 
  // The link service name is usually composed of the two module names or entity names.
  // Common pattern: "sales_channel_stock_location"
  
  const { data: links } = await remoteQuery.graph({
      entity: "sales_channel_stock_location", 
      fields: ["sales_channel_id", "stock_location_id"],
  })
  
  console.log("🔗 Raw Links (sales_channel_stock_location):")
  if (links.length > 0) {
      links.forEach(l => console.log(`- SC: ${l.sales_channel_id} <-> Loc: ${l.stock_location_id}`))
  } else {
      console.log("ℹ️ No raw links found.")
  }
}
