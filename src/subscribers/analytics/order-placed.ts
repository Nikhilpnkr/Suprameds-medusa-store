import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { ANALYTICS_MODULE } from "../../modules/analytics"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const analyticsService = container.resolve(ANALYTICS_MODULE) as any
  const orderService = container.resolve(Modules.ORDER)
  
  const order = await orderService.retrieveOrder(data.id)
  
  const today = new Date().toISOString().split("T")[0]
  
  const metrics = await analyticsService.listDailyMetrics({
      date: today
  })
  
  let metric = metrics[0]
  
  if (!metric) {
      metric = await analyticsService.createDailyMetrics({
          date: today,
          total_sales: 0,
          active_users: 0,
      })
  }
  
  // Calculate new total (safely handle potential BigNumber objects by casting to Number, 
  // though for money BigNumber is precise, for analytics approximation Number is fine)
  const currentTotal = Number(metric.total_sales)
  const orderTotal = Number(order.total)
  
  await analyticsService.updateDailyMetrics({
      id: metric.id,
      total_sales: currentTotal + orderTotal,
      active_users: (metric.active_users as number) + 1
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
