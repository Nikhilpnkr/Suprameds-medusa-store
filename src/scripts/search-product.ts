import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function searchProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  
  // Get search term from environment or use default
  const searchTerm = process.env.SEARCH_TERM || "Antibiotics Capsule 12 182mg";
  
  logger.info(`🔍 Searching for products matching: "${searchTerm}"\n`);
  logger.info(`📍 To search in Medusa Admin:`);
  logger.info(`   1. Navigate to http://localhost:9000/app/inventory`);
  logger.info(`   2. Use the search bar to search for: "${searchTerm}"`);
  logger.info(`   3. Filter by location: "Indian Warehouse"\n`);
  
  logger.info(`📝 Search Tips:`);
  logger.info(`   - Search by product title (e.g., "Antibiotics Capsule 12 182mg")`);
  logger.info(`   - Search by SKU (e.g., "AMOX-1011")`);
  logger.info(`   - Search by category (e.g., "Antibiotics")`);
  logger.info(`   - Use partial matches (e.g., "Capsule 12" will find all Capsule 12 products)\n`);
  
  logger.info(`🔄 Alternative: Search via Products page`);
  logger.info(`   1. Navigate to http://localhost:9000/app/products`);
  logger.info(`   2. Use the search bar to find products`);
  logger.info(`   3. Click on a product to view its inventory levels\n`);
  
  logger.info(`💡 Example searches:`);
  logger.info(`   - "Antibiotics" → Find all antibiotic products`);
  logger.info(`   - "Capsule 12" → Find all Capsule 12 variants`);
  logger.info(`   - "182mg" → Find all 182mg strength products`);
  logger.info(`   - "AMOX" → Find products by SKU prefix\n`);
}
