import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const prescriptionService = req.scope.resolve("prescription")
  const analyticsService = req.scope.resolve("analytics")

  // Fetch recent metrics
  const { data: metrics } = await query.graph({
    entity: "daily_metric",
    fields: ["date", "total_sales", "active_users", "top_products"],
    pagination: {
        order: { date: "DESC" },
        take: 7
    }
  })

  // Fetch prescription summary
  const { data: prescriptions } = await query.graph({
    entity: "prescription",
    fields: ["status", "id"],
  })

  const prescriptionStats = {
    pending: prescriptions.filter((p: any) => p.status === "PENDING").length,
    approved: prescriptions.filter((p: any) => p.status === "APPROVED").length,
    rejected: prescriptions.filter((p: any) => p.status === "REJECTED").length,
    total: prescriptions.length
  }

  res.json({
    analytics: {
        metrics: metrics.reverse(),
        prescriptions: prescriptionStats
    }
  })
}
