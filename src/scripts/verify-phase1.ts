
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function verifyPhase1({ container }: ExecArgs) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    logger.info("🧪 Starting Phase 1 Verification...")

    try {
        // 1. Verify Product-Pharma Link with Graph
        logger.info("Checking Product-Pharma Links...")
        const { data: products } = await query.graph({
            entity: "product",
            fields: ["id", "title", "pharma_product.*"]
        })

        products.forEach(p => {
            if (p.pharma_product) {
                logger.info(`✅ ${p.title} has pharma data (Generic: ${p.pharma_product.generic_name})`)
            } else {
                logger.warn(`❌ ${p.title} is missing pharma data`)
            }
        })

        // 2. Verify Variant-Batch Link with Graph (Query through Product)
        logger.info("Checking Variant-Batch Links (via Product)...")
        const { data: productsForBatches } = await query.graph({
            entity: "product",
            fields: ["*", "variants.*"]
        })

        if (productsForBatches.length > 0) {
            const firstProduct = productsForBatches[0]
            logger.info(`Keys on Product: ${JSON.stringify(Object.keys(firstProduct))}`)
            if (firstProduct.variants?.length > 0) {
                logger.info(`Keys on Variant: ${JSON.stringify(Object.keys(firstProduct.variants[0]))}`)
            }
        }

        productsForBatches.forEach(p => {
            logger.info(`Product: ${p.title}`)
            p.variants.forEach(v => {
                // Check basically all keys starting with 'product' or 'batch'
                const batchKeys = Object.keys(v).filter(k => k.includes('batch'))
                if (batchKeys.length > 0) {
                    logger.info(`  🔍 Found potential batch keys: ${batchKeys.join(', ')}`)
                }
            })
        })

        // 3. Test Prescription Workflow (Simulation)
        logger.info("Testing Prescription Creation...")
        const pharmaInventoryService = container.resolve("pharma_inventory")
        // No need to run workflow here, just check if service responds
        const batches = await (pharmaInventoryService as any).listProductBatches({})
        logger.info(`✅ Pharma Inventory Module detected. Found ${batches.length} total batches in system.`)

    } catch (e) {
        logger.error("Verification failed: " + e.message)
    }

    logger.info("🔚 Phase 1 Verification Complete.")
}
