import { model } from "@medusajs/framework/utils"

export const DailyMetric = model.define("daily_metric", {
    id: model.id().primaryKey(),
    date: model.text(), // YYYY-MM-DD
    total_sales: model.bigNumber().default(0),
    active_users: model.number().default(0),
    top_products: model.json().nullable(), // Array of strings or objects
})
