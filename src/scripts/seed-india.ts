
import { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import {
    createApiKeysWorkflow,
    createProductCategoriesWorkflow,
    createProductsWorkflow,
    createRegionsWorkflow,
    createSalesChannelsWorkflow,
    createShippingOptionsWorkflow,
    createShippingProfilesWorkflow,
    createStockLocationsWorkflow,
    createTaxRegionsWorkflow,
    linkSalesChannelsToApiKeyWorkflow,
    linkSalesChannelsToStockLocationWorkflow,
    updateStoresWorkflow,
    updateStoresStep,
} from "@medusajs/medusa/core-flows";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
    "update-store-currencies-india",
    (input: { supported_currencies: { currency_code: string; is_default?: boolean }[]; store_id: string; }) => {
        const normalizedInput = transform({ input }, (data) => ({
            selector: { id: data.input.store_id },
            update: {
                supported_currencies: data.input.supported_currencies.map(c => ({
                    currency_code: c.currency_code,
                    is_default: c.is_default ?? false,
                })),
            },
        }));
        const stores = updateStoresStep(normalizedInput);
        return new WorkflowResponse(stores);
    }
);

export default async function seedIndia({ container }: ExecArgs) {
    const logger = container.resolve("logger");
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const storeModuleService = container.resolve(Modules.STORE);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const pharmaService = container.resolve("pharma");
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    logger.info("🇮🇳 Seeding India Environment...");

    // 1. Store & Currency (INR)
    const [store] = await storeModuleService.listStores();
    let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });

    if (!defaultSalesChannel) {
        const { result } = await createSalesChannelsWorkflow(container).run({
            input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
        });
        defaultSalesChannel = result[0];
    }

    await updateStoreCurrencies(container).run({
        input: {
            store_id: store.id,
            supported_currencies: [{ currency_code: "inr", is_default: true }],
        },
    });

    await updateStoresWorkflow(container).run({
        input: {
            selector: { id: store.id },
            update: { default_sales_channel_id: defaultSalesChannel.id },
        },
    });

    // 2. Region (India)
    logger.info("Creating Region: India...");
    const { result: regions } = await createRegionsWorkflow(container).run({
        input: {
            regions: [{
                name: "India",
                currency_code: "inr",
                countries: ["in"],
                payment_providers: ["pp_system_default"],
            }],
        },
    });
    const region = regions[0];

    // 3. Tax
    await createTaxRegionsWorkflow(container).run({
        input: [{ country_code: "in", provider_id: "tp_system" }],
    });

    // 4. Stock Location & Shipping
    logger.info("Setting up Warehouse & Shipping...");
    const { result: locations } = await createStockLocationsWorkflow(container).run({
        input: {
            locations: [{
                name: "Mumbai Warehouse",
                address: { city: "Mumbai", country_code: "IN", address_1: "Andheri East" },
            }],
        },
    });
    const location = locations[0];

    await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { default_location_id: location.id } },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: location.id, add: [defaultSalesChannel.id] },
    });

    // Fulfillment
    const { result: shippingProfiles } = await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: "Default", type: "default" }] },
    });

    // Link Location to Fulfillment
    await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    // 5. Products (Calpol, Dolo)
    logger.info("Seeding Pharma Products...");
    
    const productsData = [
        {
            title: "Calpol 500mg",
            description: "Analgesic and Antipyretic",
            handle: "calpol-500",
            status: ProductStatus.PUBLISHED,
            options: [{ title: "Pack Size", values: ["Strip of 15"] }],
            variants: [{
                title: "Strip of 15",
                sku: "CAL-500-15",
                prices: [{ amount: 45, currency_code: "inr" }],
                options: { "Pack Size": "Strip of 15" },
                inventory_quantity: 100,
                manage_inventory: true,
            }],
            pharma: {
                brand_name: "Calpol",
                generic_name: "Paracetamol",
                strength: "500",
                strength_unit: "mg",
                dosage_form: "Tablet",
                schedule_type: "OTC",
                manufacturer: "GSK",
                company_name: "GlaxoSmithKline Pharmaceuticals Ltd",
                pack_size_label: "Strip of 15",
                indication: "Fever, Mild to moderate pain (Headache, Toothache, Muscle ache)",
                mechanism_of_action: "Inhibits prostaglandin synthesis in the central nervous system and blocks pain impulse generation.",
                alcohol_safety: "Unsafe - Avoid alcohol while taking paracetamol as it increases the risk of liver damage.",
                pregnancy_safety: "Safe if prescribed - Generally considered safe but consult your doctor.",
                driving_safety: "Safe - Does not usually affect the ability to drive.",
                kidney_safety: "Caution - Dose adjustment may be needed in patients with severe kidney disease.",
                liver_safety: "Warning - Use with extreme caution. Overdose can cause fatal liver failure.",
                storage_instructions: "Store in a cool, dry place away from direct sunlight.",
                side_effects_detailed: "Common side effects include nausea, stomach pain, and loss of appetite. Seek medical help for allergic reactions like rashes or swelling."
            }
        },
        {
            title: "Dolo 650",
            description: "Fever and Pain Relief",
            handle: "dolo-650",
            status: ProductStatus.PUBLISHED,
            options: [{ title: "Pack Size", values: ["Strip of 15"] }],
            variants: [{
                title: "Strip of 15",
                sku: "DOLO-650-15",
                prices: [{ amount: 30, currency_code: "inr" }],
                options: { "Pack Size": "Strip of 15" },
                inventory_quantity: 500,
                manage_inventory: true,
            }],
            pharma: {
                brand_name: "Dolo",
                generic_name: "Paracetamol",
                strength: "650",
                strength_unit: "mg",
                dosage_form: "Tablet",
                manufacturer: "Micro Labs",
                company_name: "Micro Labs Ltd",
                pack_size_label: "Strip of 15",
                indication: "High fever, Severe pain, Post-vaccination fever",
                side_effects_detailed: "Nausea, vomiting, allergic skin reactions. Rare: Liver damage in case of overdose.",
                alcohol_safety: "Avoid - Severe liver risk.",
                pregnancy_safety: "Generally safe - Consult doctor for dosage.",
                liver_safety: "Contraindicated in severe liver disease.",
                storage_instructions: "Keep out of reach of children. Store below 25°C."
            }
        }
    ];

    try {
        const { result: createdProducts } = await createProductsWorkflow(container).run({
            input: {
                products: productsData.map(p => ({
                    title: p.title,
                    description: p.description,
                    handle: p.handle,
                    status: p.status,
                    options: p.options,
                    variants: p.variants,
                    sales_channels: [{ id: defaultSalesChannel.id }]
                }))
            }
        });

        // Link Pharma Data & Create Batches
        for (let i = 0; i < createdProducts.length; i++) {
            const product = createdProducts[i];
            const pData = productsData[i].pharma;

            try {
                // 1. Create Pharma Product
                const pharmaProduct = await pharmaService.createPharmaProducts(pData as any);
                
                await remoteLink.create({
                    [Modules.PRODUCT]: { product_id: product.id },
                    "pharma": { pharma_product_id: pharmaProduct.id }
                });

                // 2. Create Batches for each variant
                const pharmaInventoryService = container.resolve("pharma_inventory");
                const variants = product.variants || [];

                for (const variant of variants) {
                    // Create a "Soon to expire" batch
                    const batch1 = await pharmaInventoryService.createProductBatches({
                        batch_number: `B1-${variant.sku}`,
                        variant_id: variant.id,
                        expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days from now
                        quantity: 20,
                        manufacturing_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300),
                    });

                    // Create a "Fresh" batch
                    const batch2 = await pharmaInventoryService.createProductBatches({
                        batch_number: `B2-${variant.sku}`,
                        variant_id: variant.id,
                        expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2), // 2 years from now
                        quantity: 80,
                        manufacturing_date: new Date(),
                    });

                    // Link Batches to Variant
                    await remoteLink.create([
                        {
                            [Modules.PRODUCT]: { variant_id: variant.id },
                            "pharma_inventory": { product_batch_id: batch1.id }
                        },
                        {
                            [Modules.PRODUCT]: { variant_id: variant.id },
                            "pharma_inventory": { product_batch_id: batch2.id }
                        }
                    ]);
                }

                logger.info(`✅ Seeded pharma & batches for ${product.title}`);
            } catch (innerError) {
                logger.warn(`Failed to create pharma/batch data for ${product.title}: ${innerError}`);
            }
        }
    } catch (e) {
        logger.error("Error creating products: " + JSON.stringify(e, null, 2));
        throw e;
    }

    logger.info("✅ India Environment Seeded Successfully!");
}
