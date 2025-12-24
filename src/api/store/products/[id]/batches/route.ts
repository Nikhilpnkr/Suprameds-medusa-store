
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        const { id } = req.params
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        console.log(`Fetching batches for product variants of ${id}...`)

        const { data: products } = await query.graph({
            entity: "product",
            fields: [
                "id", 
                "variants.id", 
                "variants.title", 
                "variants.sku", 
                "variants.product_batches.*"
            ],
            filters: { id }
        })

        const product = products[0]
        const variantsWithBatches = product?.variants || []

        res.json({ variants: variantsWithBatches })
    } catch (error) {
        console.error("Error in product batches route:", error)
        res.json({ variants: [] })
    }
}
