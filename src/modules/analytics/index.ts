import { Module } from "@medusajs/framework/utils"
import AnalyticsService from "./service"

export const ANALYTICS_MODULE = "analytics"

export default Module(ANALYTICS_MODULE, {
    service: AnalyticsService,
})
