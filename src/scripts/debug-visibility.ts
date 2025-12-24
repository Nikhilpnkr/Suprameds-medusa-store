import * as fs from 'fs';
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function debugVisibility({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("Debugging Visibility...");

    const { data: apiKeys } = await query.graph({
        entity: "api_key",
        fields: ["id", "title", "token", "type", "sales_channels.id", "sales_channels.name"],
    });

    let output = "--- API KEYS ---\n";
    for (const key of apiKeys) {
        output += `ID: ${key.id}\n`;
        output += `Title: ${key.title}\n`;
        output += `Type: ${key.type}\n`;
        output += `Token: ${key.token}\n`;
        output += `Linked Sales Channels: ${key.sales_channels?.map((sc: any) => sc.name).join(", ") || "None"}\n`;
        output += "----------------\n";
    }

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "status", "sales_channels.id", "sales_channels.name"],
        filters: {
            title: "Suprameds Product 1"
        }
    });

    output += "--- SAMPLE PRODUCT CHECK ---\n";
    if (products.length > 0) {
        const p = products[0];
        output += `Product: ${p.title}\n`;
        output += `Status: ${p.status}\n`;
        output += `Sales Channels: ${p.sales_channels?.map((sc: any) => sc.name).join(", ") || "None"}\n`;
    } else {
        output += "Suprameds Product 1 not found.\n";
    }

    fs.writeFileSync('visibility_report.txt', output);
    logger.info("Report written to visibility_report.txt");
}
