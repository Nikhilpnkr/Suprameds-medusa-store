
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function testLink({ container }: ExecArgs) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve("logger")

    logger.info("🧪 Testing Product-Pharma Link...")

    try {
        const { data: products } = await query.graph({
            entity: "product",
            fields: ["id", "title", "pharma_product.*"],
        })

        logger.info(`Found ${products.length} products`)
        products.forEach(p => {
            logger.info(`Product: ${p.title} (${p.id})`)
            if (p.pharma_product) {
                logger.info(`  Pharma Data: ${JSON.stringify(p.pharma_product)}`)
            } else {
                logger.warn(`  No Pharma Data found for ${p.title}`)
            }
        })

        // Also test the reverse if possible
        const { data: pharmaProducts } = await query.graph({
            entity: "pharma_product",
            fields: ["id", "brand_name", "product.*"],
        })

        logger.info(`Found ${pharmaProducts.length} pharma products`)
        pharmaProducts.forEach(pp => {
            logger.info(`Pharma: ${pp.brand_name} (${pp.id})`)
            if (pp.product) {
                logger.info(`  Linked Product: ${pp.product.title} (${pp.product.id})`)
            } else {
                logger.warn(`  No Linked Product found for ${pp.brand_name}`)
            }
        })

    } catch (error) {
        logger.error(`Error during link test: ${error.message}`)
        console.error(error)
    }
}
