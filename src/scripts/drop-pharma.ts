
import { ExecArgs } from "@medusajs/framework/types"

export default async function dropPharmaTable({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const db = container.resolve("pg_connection")

    logger.info("🧨 Dropping Pharma Tables...")

    try {
        // Drop pharma_product table
        await db.query(`DROP TABLE IF EXISTS "pharma_product" CASCADE;`)
        logger.info("  Dropped table pharma_product")

        // Drop link table if exists
        // The link table name is usually product_pharma_product or similar
        // Let's try to find it
        await db.query(`DROP TABLE IF EXISTS "product_pharma_product" CASCADE;`)
        logger.info("  Dropped table product_pharma_product (if existed)")

        logger.info("✅ Tables dropped successfully.")
    } catch (error) {
        logger.error(`Error dropping tables: ${error.message}`)
    }
}
