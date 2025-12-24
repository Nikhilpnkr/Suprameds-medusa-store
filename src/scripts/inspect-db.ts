
import { ExecArgs } from "@medusajs/framework/types"

export default async function inspectDb({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const db = container.resolve("pg_connection")

    logger.info("Keys of pg_connection: " + Object.keys(db).join(", "))
    
    if (db.raw) {
        logger.info("Found db.raw (Knex?)")
    }
}
