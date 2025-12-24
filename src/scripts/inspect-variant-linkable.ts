
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function inspectProductVariantLinkable({ container }: ExecArgs) {
    const logger = container.resolve("logger")
    const productService = container.resolve(Modules.PRODUCT)

    logger.info("Inspecting ProductVariant Linkable...")
    const linkable = (productService as any).linkable
    const variantLinkable = linkable.productVariant
    
    if (variantLinkable) {
        logger.info(`Entity: ${variantLinkable.entity}`)
        logger.info(`Keys: ${JSON.stringify(Object.keys(variantLinkable))}`)
        // Check for specific key properties
        if (variantLinkable.primaryKey) logger.info(`Primary Key: ${variantLinkable.primaryKey}`)
        // In Medusa v2, the key used in remoteLink is often derived from the service name and entity
        // If entity is 'variant', key might be 'variant_id'
    } else {
        logger.warn("productVariant linkable NOT found")
    }
}
