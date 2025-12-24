import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function deleteAllProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve("product");
  
  logger.info("🗑️ Deleting all products...");
  
  // List all products
  const products = await productService.listProducts({});
  
  logger.info(`Found ${products.length} products to delete`);
  
  // Delete each product
  for (const product of products) {
    await productService.deleteProducts([product.id]);
    logger.info(`Deleted: ${product.title}`);
  }
  
  logger.info(`✅ Successfully deleted ${products.length} products`);
}
