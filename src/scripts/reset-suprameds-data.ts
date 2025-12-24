import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function resetSupramedsData({ container }: ExecArgs) {
    const logger = container.resolve("logger");
    const productModuleService = container.resolve(Modules.PRODUCT);
    const query = container.resolve("query");

    logger.info("Starting cleanup of Suprameds data...");

    // 1. Find Suprameds Products
    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle"],
        filters: {
            handle: { $like: "supra-product-%" }
        }
    });

    if (products.length > 0) {
        logger.info(`Found ${products.length} Suprameds products. Deleting...`);
        const productIds = products.map((p) => p.id);

        await deleteProductsWorkflow(container).run({
            input: { ids: productIds }
        });
        logger.info("Deleted Suprameds products.");
    } else {
        logger.info("No Suprameds products found.");
    }

    // 2. Find Medicines Category
    const categories = await productModuleService.listProductCategories({
        name: "Medicines"
    });

    if (categories.length > 0) {
        logger.info(`Found 'Medicines' category. Deleting...`);
        const categoryIds = categories.map(c => c.id);

        // Using service directly for simplicity and certainty
        await productModuleService.deleteProductCategories(categoryIds);
        logger.info("Deleted 'Medicines' category.");
    } else {
        logger.info("'Medicines' category not found.");
    }

    logger.info("Cleanup finished.");
}
