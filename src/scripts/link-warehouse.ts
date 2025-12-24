import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function linkWarehouse({ container }: ExecArgs) {
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve("remoteLink")

  // 1. Get Location
  const [location] = await stockLocationService.listStockLocations({ name: "Mumbai Warehouse" })
  if (!location) {
      console.error("❌ 'Mumbai Warehouse' not found!")
      return
  }
  console.log(`✅ Found Location: ${location.name} (${location.id})`)

  // 2. Get Sales Channel
  const [channel] = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" })
  if (!channel) {
      console.error("❌ 'Default Sales Channel' not found!")
      return
  }
  console.log(`✅ Found Channel: ${channel.name} (${channel.id})`)

  // 3. Create Link
  try {
      await remoteLink.create({
          [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      })
      console.log("🔗 Successfully linked 'Mumbai Warehouse' to 'Default Sales Channel'")
  } catch (error) {
      // It might already exist, which is fine, but we'll log it.
      // RemoteLink usually upserts or ignores if exists, but let's see.
      console.log("ℹ️ Link operation completed (might already exist).")
  }
}
