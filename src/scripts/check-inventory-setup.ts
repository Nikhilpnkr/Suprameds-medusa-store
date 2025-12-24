import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkInventorySetup({ container }: ExecArgs) {
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  const locations = await stockLocationService.listStockLocations({})
  const channels = await salesChannelService.listSalesChannels({})

  console.log("----------------------------------------------------------------")
  console.log("🏭 Current Stock Locations:")
  if (locations.length === 0) {
    console.log("   [NONE FOUND]")
  } else {
    locations.forEach(loc => {
      console.log(`   - ID: ${loc.id} | Name: ${loc.name}`)
    })
  }

  console.log("\n🌐 Current Sales Channels:")
  channels.forEach(channel => {
    console.log(`   - ID: ${channel.id} | Name: ${channel.name}`)
  })
  console.log("----------------------------------------------------------------")
}
