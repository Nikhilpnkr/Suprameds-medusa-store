import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function checkInventory({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve("stock_location");
  const inventoryService = container.resolve("inventory");
  const locations = await stockLocationService.listStockLocations({ name: "Indian Warehouse" });
  if (locations.length === 0) {
    logger.warn("⚠️ Indian Warehouse not found.");
    return;
  }
  const locationId = locations[0].id;
  const levels = await inventoryService.listInventoryLevels({ location_id: locationId });
  logger.info(`📦 Inventory Levels for ${locationId}: ${levels.length} items`);
  logger.info(`Details: ${JSON.stringify(levels.slice(0, 5).map(l => ({inventory_item_id: l.inventory_item_id, stocked_quantity: l.stocked_quantity})))}`);
}
