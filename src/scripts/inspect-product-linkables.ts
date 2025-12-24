
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function inspectProductLinkables({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const productService = container.resolve(Modules.PRODUCT)

    logger.info("Inspecting Product Linkables...")
    const linkable = (productService as any).linkable
    
    if (linkable) {
        for (const key of Object.keys(linkable)) {
            logger.info(`Linkable: ${key}`)
            // Attempt to look at the linkable definition
            const def = linkable[key]
            logger.info(`  Service Name: ${def.serviceName}`)
            logger.info(`  Entity: ${def.entity}`)
            // Important: keys used in remoteLink
            const keys = Object.keys(def).filter(k => k.includes('Key'))
            logger.info(`  Link Keys: ${JSON.stringify(keys)}`)
            if (def.primaryKey) logger.info(`  Primary Key: ${def.primaryKey}`)
        }
    }
}
