import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function unlinkWarehouse({ container }: ExecArgs) {
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve("remoteLink")

  // 1. Get Location
  const [location] = await stockLocationService.listStockLocations({ name: "Mumbai Warehouse" })
  if (!location) {
      console.error("❌ 'Mumbai Warehouse' not found!")
      return
  }
  
  // 2. Get Sales Channel
  const [channel] = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" })
  if (!channel) {
      console.error("❌ 'Default Sales Channel' not found!")
      return
  }

  // 3. Remove Link
  try {
      await remoteLink.dismiss({
          [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      })
      console.log("🔗 Successfully UNLINKED 'Mumbai Warehouse' from 'Default Sales Channel'")
  } catch (error) {
      console.error("❌ Error unlinking:", error)
  }
}
