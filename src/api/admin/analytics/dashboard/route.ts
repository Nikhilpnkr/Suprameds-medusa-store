import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Fetch last 30 days
  const { data: metrics } = await query.graph({
      entity: "daily_metric",
      fields: ["*"],
  })

  // Format for frontend (e.g., chart.js)
  const chartData = {
      labels: metrics.map(m => m.date),
      datasets: [
          {
              label: "Sales",
              data: metrics.map(m => m.total_sales),
          }
      ]
  }

  res.json({ analytics: chartData })
}
