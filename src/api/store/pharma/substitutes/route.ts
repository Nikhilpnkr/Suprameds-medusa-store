
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        const { generic_name, current_product_id } = req.query
        
        if (!generic_name) {
            return res.json({ substitutes: [] })
        }

        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
        
        console.log(`🔎 Searching substitutes for: ${generic_name}`)

        // 1. Find all pharma products with same generic name
        const { data: pharmaProducts } = await query.graph({
            entity: "pharma_product",
            fields: [
                "product.id", 
                "product.title", 
                "product.thumbnail", 
                "product.handle",
                "product.variants.prices.*",
                "generic_name",
                "strength",
                "brand_name"
            ],
            filters: { 
                generic_name: generic_name,
            }
        })

        // 2. Filter out current product and map to simplified structure
        const substitutes = pharmaProducts
            .filter((p: any) => p.product && p.product.id !== current_product_id)
            .map((p: any) => {
                const product = p.product
                // Simple price extraction (lowest price)
                let lowestPrice = null
                let currency = "INR" // Default
                
                if (product.variants && product.variants.length > 0) {
                     // Check first variant's prices
                     const prices = product.variants[0].prices
                     if (prices && prices.length > 0) {
                        const inrPrice = prices.find((pr: any) => pr.currency_code === "inr")
                        const eurPrice = prices.find((pr: any) => pr.currency_code === "eur")
                        const usdPrice = prices.find((pr: any) => pr.currency_code === "usd")
                        
                        const priceObj = inrPrice || eurPrice || usdPrice || prices[0]
                        lowestPrice = priceObj.amount
                        currency = priceObj.currency_code
                     }
                }

                return {
                    id: product.id,
                    title: product.title,
                    handle: product.handle,
                    thumbnail: product.thumbnail,
                    brand_name: p.brand_name,
                    price: lowestPrice,
                    currency_code: currency
                }
            })

        res.json({ substitutes })
    } catch (error) {
        console.error("Error fetching substitutes:", error)
        res.status(500).json({ substitutes: [] })
    }
}
