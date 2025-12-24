
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function testLinkKeys({ container }: ExecArgs) {
    const remoteLink = container.resolve("remoteLink")
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    logger.info("Testing Link Keys...")
    
    // Get a variant
    const { data: variants } = await query.graph({
        entity: "variant",
        fields: ["id", "sku"]
    })
    
    if (variants.length === 0) return logger.error("No variants found")
    const variant = variants[0]
    
    // Create a dummy batch handle/id
    const dummyBatchId = "pb_test_" + Date.now()

    logger.info(`Testing link for variant ${variant.id} with batch ${dummyBatchId}`)
    
    const possibleKeys = ["variant_id", "product_variant_id", "id"]
    
    for (const key of possibleKeys) {
        try {
            logger.info(`Trying key: ${key}`)
            await remoteLink.create({
                [Modules.PRODUCT]: { [key]: variant.id },
                "pharma_inventory": { product_batch_id: dummyBatchId }
            })
            logger.info(`✅ Successfully created link with key: ${key}`)
            
            // Try to query it back
            const { data: result } = await query.graph({
                entity: "product_variant",
                fields: ["id", "product_batches.*"],
                filters: { id: variant.id }
            })
            
            if (result[0]?.product_batches?.length > 0) {
                logger.info(`🎉 Found linked batch with key ${key}! Graph property: product_batches`)
            } else {
                 const { data: result2 } = await query.graph({
                    entity: "product_variant",
                    fields: ["id", "product_batch.*"],
                    filters: { id: variant.id }
                })
                if (result2[0]?.product_batch?.length > 0) {
                     logger.info(`🎉 Found linked batch with key ${key}! Graph property: product_batch`)
                } else {
                    logger.warn(`❌ Link created with ${key} but not showing in graph`)
                }
            }
        } catch (e) {
            logger.warn(`❌ Failed with key ${key}: ${e.message}`)
        }
    }
}
