import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function createIndianWarehouse({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve("stock_location");
  
  const locations = await stockLocationService.listStockLocations({ name: "Indian Warehouse" });
  
  if (locations.length > 0) {
    logger.info(`✅ Indian Warehouse already exists: ${locations[0].id}`);
    return;
  }
  
  try {
    const newLocation = await stockLocationService.createStockLocations({
      name: "Indian Warehouse",
      address: {
        address_1: "123 Pharma Street",
        city: "Mumbai",
        country_code: "in",
        postal_code: "400001"
      }
    });
    logger.info(`✅ Created Indian Warehouse: ${newLocation.id}`);
  } catch (error) {
    logger.error("❌ Failed to create stock location:", error);
    throw error;
  }
}
