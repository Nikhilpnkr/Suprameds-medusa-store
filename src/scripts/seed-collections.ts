
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function seedCollections({ container }: ExecArgs) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    logger.info("🌱 Seeding Pharma Collections...")

    try {
        const productModuleService = container.resolve(Modules.PRODUCT)

        // 1. Get existing products
        const { data: products } = await query.graph({
            entity: "product",
            fields: ["id", "title"]
        })

        const productIds = products.map(p => p.id)

        // 2. Create Collections with product assignments
        const collectionsData = [
            { 
                title: "Medicines", 
                handle: "medicines",
                product_ids: productIds // Assign all products to medicines for now
            },
            { title: "Wellness", handle: "wellness" },
            { title: "Personal Care", handle: "personal-care" }
        ]

        const createdCollections = await (productModuleService as any).createProductCollections(collectionsData)
        logger.info(`✅ Created ${createdCollections.length} collections and assigned products.`)

    } catch (e) {
        logger.error("Seeding collections failed: " + e.message)
    }

    logger.info("🔚 Collection Seeding Complete.")
}
