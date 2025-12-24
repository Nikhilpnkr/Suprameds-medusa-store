import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(data.id)

  console.log("----------------------------------------------------------------")
  console.log(`📧 [SIMULATION] Sending Order Confirmation Email to: ${order.email}`)
  console.log(`📦 Order ID: ${order.id} | Total: ${(Number(order.total) / 100).toFixed(2)} ${order.currency_code.toUpperCase()}`)
  console.log("----------------------------------------------------------------")
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
