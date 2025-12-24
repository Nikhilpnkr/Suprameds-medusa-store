
import { ExecArgs } from "@medusajs/framework/types"

export default async function dropPharmaV2({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const manager = container.resolve("manager")

    logger.info("🧨 Dropping Pharma Tables v2...")

    try {
        await manager.execute(`DROP TABLE IF EXISTS "pharma_product" CASCADE;`)
        logger.info("  Dropped table pharma_product")
        
        await manager.execute(`DROP TABLE IF EXISTS "product_pharma_product" CASCADE;`)
        logger.info("  Dropped table product_pharma_product")

        logger.info("✅ Tables dropped successfully.")
    } catch (error) {
        logger.error(`Error dropping tables: ${error.message}`)
        console.error(error)
    }
}
