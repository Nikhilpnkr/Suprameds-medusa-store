
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        const { id } = req.params
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        console.log(`Fetching pharma data for product ${id} using query.graph...`)

        const { data: products } = await query.graph({
            entity: "product",
            fields: ["id", "title", "pharma_product.*"],
            filters: { id }
        })

        const product = products[0]
        const pharmaData = product?.pharma_product || null

        res.json({ pharma: pharmaData })
    } catch (error) {
        console.error("Error in pharma route:", error)
        // Return null instead of error to prevent frontend crash
        res.json({ pharma: null })
    }
}
