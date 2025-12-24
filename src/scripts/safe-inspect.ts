
import { ExecArgs } from "@medusajs/framework/types"

export default async function safeInspect({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const pg = container.resolve("pg_connection")

    logger.info("🧪 Inspecting pharma_product columns...")

    try {
        const result = await pg.raw(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pharma_product';
        `)
        
        const columns = result.rows || result
        logger.info(`Found ${columns.length} columns in pharma_product`)
        columns.forEach(c => {
            logger.info(`  - ${c.column_name} (${c.data_type})`)
        })

    } catch (error) {
        logger.error(`Error during inspection: ${error.message}`)
    }
}
