
import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function resetStore({ container }: ExecArgs) {
    const logger = container.resolve("logger");
    const query = container.resolve("query");
    const pharmaService = container.resolve("pharma");
    const pharmaInventoryService = container.resolve("pharma_inventory");

    logger.info("🚨 Starting HARD RESET of Store Data...");

    // 1. Delete Product Batches
    logger.info("Deleting Product Batches...");
    const { data: batches } = await query.graph({
        entity: "product_batch",
        fields: ["id"],
    });

    if (batches.length > 0) {
        await pharmaInventoryService.deleteProductBatches(batches.map(b => b.id));
        logger.info(`Deleted ${batches.length} batches.`);
    }

    // 2. Delete Pharma Links & Products
    // Note: We need to find Pharma Products. 
    logger.info("Deleting Pharma Data...");
    const { data: pharmaProducts } = await query.graph({
        entity: "pharma_product",
        fields: ["id"],
    });

    if (pharmaProducts.length > 0) {
        await pharmaService.deletePharmaProducts(pharmaProducts.map(p => p.id));
        logger.info(`Deleted ${pharmaProducts.length} pharma records.`);
    }

    // 3. Delete All Medusa Products
    logger.info("Deleting All Store Products...");
    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id"],
    });

    if (products.length > 0) {
        await deleteProductsWorkflow(container).run({
            input: { ids: products.map(p => p.id) }
        });
        logger.info(`Deleted ${products.length} products.`);
    }

    // 4. Delete Regions (to allow re-seeding "India")
    logger.info("Deleting Regions...");
    const regionService = container.resolve(Modules.REGION);
    const { data: regions } = await query.graph({
         entity: "region",
         fields: ["id", "name"]
    });
    
    if (regions.length > 0) {
        // We delete all regions to be safe, or just "India"/"Global"
        await regionService.deleteRegions(regions.map(r => r.id));
        logger.info(`Deleted ${regions.length} regions.`);
    }

    // 5. Delete Tax Regions
    logger.info("Deleting Tax Regions...");
    const taxService = container.resolve(Modules.TAX);
    const { data: taxRegions } = await query.graph({
         entity: "tax_region",
         fields: ["id", "country_code"]
    });
    
    if (taxRegions.length > 0) {
        await taxService.deleteTaxRegions(taxRegions.map(tr => tr.id));
        logger.info(`Deleted ${taxRegions.length} tax regions.`);
    }

    // 6. Delete Shipping Options
    logger.info("Deleting Shipping Options...");
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
    const shippingOptions = await fulfillmentModule.listShippingOptions();
    if (shippingOptions.length > 0) {
        await fulfillmentModule.deleteShippingOptions(shippingOptions.map(so => so.id));
        logger.info(`Deleted ${shippingOptions.length} shipping options.`);
    }

    // 7. Delete Shipping Profiles
    logger.info("Deleting Shipping Profiles...");
    const shippingProfiles = await fulfillmentModule.listShippingProfiles();
    if (shippingProfiles.length > 0) {
        await fulfillmentModule.deleteShippingProfiles(shippingProfiles.map(sp => sp.id));
        logger.info(`Deleted ${shippingProfiles.length} shipping profiles.`);
    }

    // 8. Delete Stock Locations
    logger.info("Deleting Stock Locations...");
    const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
    const stockLocations = await stockLocationService.listStockLocations({});
    if (stockLocations.length > 0) {
         await stockLocationService.deleteStockLocations(stockLocations.map(sl => sl.id));
         logger.info(`Deleted ${stockLocations.length} stock locations.`);
    }

    logger.info("✅ Store Reset Complete. Ready for India Seed.");
}
