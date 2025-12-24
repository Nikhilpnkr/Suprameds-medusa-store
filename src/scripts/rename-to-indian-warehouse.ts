import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function renameToIndianWarehouse({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve("stock_location");
  
  // Find European Warehouse
  const euLocations = await stockLocationService.listStockLocations({ name: "European Warehouse" });
  
  if (euLocations.length > 0) {
    const euWarehouse = euLocations[0];
    logger.info(`Found European Warehouse: ${euWarehouse.id}`);
    
    // Update to Indian Warehouse
    await stockLocationService.updateStockLocations(euWarehouse.id, {
      name: "Indian Warehouse",
      address: {
        address_1: "123 Pharma Street",
        city: "Mumbai",
        country_code: "in",
        postal_code: "400001"
      }
    });
    
    logger.info(`✅ Renamed to Indian Warehouse: ${euWarehouse.id}`);
  } else {
    logger.warn("⚠️ European Warehouse not found. Creating Indian Warehouse instead...");
    
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
  }
}
