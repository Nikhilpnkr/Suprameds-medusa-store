import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function listStockLocations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve("stock_location");
  const locations = await stockLocationService.listStockLocations({});
  logger.info(`📍 Stock Locations: ${JSON.stringify(locations.map(l => ({id: l.id, name: l.name})))}`);
}
