import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function forceUnlinkAll({ container }: ExecArgs) {
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const remoteLink = container.resolve("remoteLink")
  const remoteQuery = container.resolve("remoteQuery")

  console.log("☢️ Starting Nuclear Unlink...")

  // 1. Get Default SC
  const [sc] = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" })
  if (!sc) { return }

  // 2. Query Links
  const { data: links } = await remoteQuery.graph({
      entity: "sales_channel",
      fields: ["stock_locations.id"],
      filters: { id: sc.id }
  })

  // 3. Delete Links
  if (links && links.length > 0 && links[0].stock_locations) {
      for (const loc of links[0].stock_locations) {
          console.log(`- Unlinking Stock Location ID: ${loc.id}`)
          await remoteLink.dismiss({
              [Modules.SALES_CHANNEL]: { sales_channel_id: sc.id },
              [Modules.STOCK_LOCATION]: { stock_location_id: loc.id }
          })
      }
      console.log("✅ All locations unlinked.")
  } else {
      console.log("ℹ️ No locations found to unlink.")
  }
}
