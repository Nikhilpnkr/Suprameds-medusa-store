import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkScLocations({ container }: ExecArgs) {
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const remoteQuery = container.resolve("remoteQuery")
  
  // 1. Get Default SC
  const [sc] = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" })
  if (!sc) {
      console.log("❌ Default Sales Channel not found")
      return
  }
  console.log(`ℹ️ Sales Channel: ${sc.name} (${sc.id})`)

  // 2. Query Links
  const { data: links } = await remoteQuery.graph({
      entity: "sales_channel",
      fields: ["stock_locations.*"],
      filters: { id: sc.id }
  })
  
  if (links && links.length > 0 && links[0].stock_locations) {
      console.log(`📦 Linked Stock Locations: ${links[0].stock_locations.length}`)
      links[0].stock_locations.forEach(l => {
        if (l) console.log(`- ${JSON.stringify(l)}`)
        else console.log("- (Null Location Link)")
      })
  } else {
      console.log("⚠️ No Stock Locations linked to this Sales Channel!")
  }
}
