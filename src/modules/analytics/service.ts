import { MedusaService } from "@medusajs/framework/utils"
import { DailyMetric } from "./models/daily-metric"

class AnalyticsService extends MedusaService({
    DailyMetric,
}) { }

export default AnalyticsService
