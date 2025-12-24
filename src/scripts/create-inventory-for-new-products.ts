import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows";

export default async function createInventoryForNewProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve("stock_location");
  const inventoryService = container.resolve("inventory");
  
  logger.info("📦 Creating inventory levels for newly seeded products...");
  
  // Get Indian Warehouse location
  const locations = await stockLocationService.listStockLocations({ name: "Indian Warehouse" });
  const stockLocationId = locations[0]?.id;
  
  if (!stockLocationId) {
    logger.error("❌ Indian Warehouse not found");
    return;
  }
  
  logger.info(`✅ Found Indian Warehouse: ${stockLocationId}`);
  
  // Get all inventory items
  const inventoryItems = await inventoryService.listInventoryItems({});
  logger.info(`Found ${inventoryItems.length} inventory items`);
  
  // Create inventory levels for each item
  const inventoryLevels = inventoryItems.map(item => ({
    location_id: stockLocationId,
    inventory_item_id: item.id,
    stocked_quantity: 1000,
  }));
  
  if (inventoryLevels.length > 0) {
    try {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: inventoryLevels },
      });
      logger.info(`✅ Created ${inventoryLevels.length} inventory levels linked to Indian Warehouse`);
    } catch (error) {
      logger.error(`❌ Error creating inventory levels: ${error.message}`);
      logger.info("This is expected if inventory levels already exist. Skipping...");
    }
  } else {
    logger.warn("⚠️ No inventory items found");
  }
}
