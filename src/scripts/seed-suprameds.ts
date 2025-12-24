import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
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
    updateStoresStep,
    updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import {
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import PharmaService from "../modules/pharma/service";

const updateStoreCurrencies = createWorkflow(
    "update-store-currencies",
    (input: {
        supported_currencies: { currency_code: string; is_default?: boolean }[];
        store_id: string;
    }) => {
        const normalizedInput = transform({ input }, (data) => {
            return {
                selector: { id: data.input.store_id },
                update: {
                    supported_currencies: data.input.supported_currencies.map(
                        (currency) => {
                            return {
                                currency_code: currency.currency_code,
                                is_default: currency.is_default ?? false,
                            };
                        }
                    ),
                },
            };
        });

        const stores = updateStoresStep(normalizedInput);

        return new WorkflowResponse(stores);
    }
);

export default async function seedSupramedsData({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const storeModuleService = container.resolve(Modules.STORE);

    const countries = ["gb", "de", "dk", "se", "fr", "es", "it", "in", "us"];

    logger.info("Seeding store data...");
    const [store] = await storeModuleService.listStores();
    let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    if (!defaultSalesChannel.length) {
        const { result: salesChannelResult } = await createSalesChannelsWorkflow(
            container
        ).run({
            input: {
                salesChannelsData: [
                    {
                        name: "Default Sales Channel",
                    },
                ],
            },
        });
        defaultSalesChannel = salesChannelResult;
    }

    await updateStoreCurrencies(container).run({
        input: {
            store_id: store.id,
            supported_currencies: [
                {
                    currency_code: "eur",
                    is_default: true,
                },
                {
                    currency_code: "usd",
                },
                {
                    currency_code: "inr",
                },
            ],
        },
    });

    await updateStoresWorkflow(container).run({
        input: {
            selector: { id: store.id },
            update: {
                default_sales_channel_id: defaultSalesChannel[0].id,
            },
        },
    });

    logger.info("Seeding region data...");
    const regionModuleService = container.resolve(Modules.REGION);
    const existingRegions = await regionModuleService.listRegions({}, {
        take: 1
    });

    let region;
    if (existingRegions.length > 0) {
        region = existingRegions[0];
        logger.info(`Using existing region: ${region.name}`);
    } else {
        const { result: regionResult } = await createRegionsWorkflow(container).run({
            input: {
                regions: [
                    {
                        name: "Global",
                        currency_code: "usd",
                        countries,
                        payment_providers: ["pp_system_default"],
                    },
                ],
            },
        });
        region = regionResult[0];
    }

    logger.info("Seeding tax regions...");
    const taxModuleService = container.resolve(Modules.TAX);
    const existingTaxRegions = await taxModuleService.listTaxRegions({
        country_code: countries,
    });

    if (existingTaxRegions.length === 0) {
        await createTaxRegionsWorkflow(container).run({
            input: countries.map((country_code) => ({
                country_code,
                provider_id: "tp_system",
            })),
        });
    }

    logger.info("Seeding stock location data...");
    const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
    const existingStockLocations = await stockLocationModuleService.listStockLocations({
        name: "Main Warehouse",
    });

    let stockLocation;
    if (existingStockLocations.length > 0) {
        stockLocation = existingStockLocations[0];
    } else {
        const { result: stockLocationResult } = await createStockLocationsWorkflow(
            container
        ).run({
            input: {
                locations: [
                    {
                        name: "Main Warehouse",
                        address: {
                            city: "New York",
                            country_code: "US",
                            address_1: "123 Pharma Way",
                        },
                    },
                ],
            },
        });
        stockLocation = stockLocationResult[0];
    }

    await updateStoresWorkflow(container).run({
        input: {
            selector: { id: store.id },
            update: {
                default_location_id: stockLocation.id,
            },
        },
    });

    await link.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_provider_id: "manual_manual",
        },
    });

    logger.info("Seeding fulfillment data...");
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
        type: "default",
    });
    let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

    if (!shippingProfile) {
        const { result: shippingProfileResult } =
            await createShippingProfilesWorkflow(container).run({
                input: {
                    data: [
                        {
                            name: "Default Shipping Profile",
                            type: "default",
                        },
                    ],
                },
            });
        shippingProfile = shippingProfileResult[0];
    }

    const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
        name: "Global Delivery",
    });

    let fulfillmentSet;
    if (existingFulfillmentSets.length > 0) {
        fulfillmentSet = existingFulfillmentSets[0];
    } else {
        fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
            name: "Global Delivery",
            type: "shipping",
            service_zones: [
                {
                    name: "Global",
                    geo_zones: countries.map(c => ({ country_code: c, type: "country" } as any)),
                },
            ],
        });
    }

    await link.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_set_id: fulfillmentSet.id,
        },
    });

    try {
        await createShippingOptionsWorkflow(container).run({
            input: [
                {
                    name: "Standard Shipping",
                    price_type: "flat",
                    provider_id: "manual_manual",
                    service_zone_id: fulfillmentSet.service_zones[0].id,
                    shipping_profile_id: shippingProfile.id,
                    type: {
                        label: "Standard",
                        description: "Ship in 3-5 days.",
                        code: "standard",
                    },
                    prices: [
                        {
                            currency_code: "usd",
                            amount: 10,
                        },
                        {
                            currency_code: "eur",
                            amount: 10,
                        },
                        {
                            currency_code: "inr",
                            amount: 500,
                        },
                        {
                            region_id: region.id,
                            amount: 10,
                        },
                    ],
                    rules: [
                        {
                            attribute: "enabled_in_store",
                            value: "true",
                            operator: "eq",
                        },
                        {
                            attribute: "is_return",
                            value: "false",
                            operator: "eq",
                        },
                    ],
                },
            ],
        });
    } catch (e) {
        logger.info("Shipping options might already exist. Continuing...");
    }

    await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
            id: stockLocation.id,
            add: [defaultSalesChannel[0].id],
        },
    });

    logger.info("Seeding publishable API key data...");
    const apiKeyModuleService = container.resolve(Modules.API_KEY);
    const existingApiKeys = await apiKeyModuleService.listApiKeys({
        title: "Webshop",
    });

    let publishableApiKey;
    if (existingApiKeys.length > 0) {
        publishableApiKey = existingApiKeys[0];
    } else {
        const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
            container
        ).run({
            input: {
                api_keys: [
                    {
                        title: "Webshop",
                        type: "publishable",
                        created_by: "",
                    },
                ],
            },
        });
        publishableApiKey = publishableApiKeyResult[0];
    }

    await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
            id: publishableApiKey.id,
            add: [defaultSalesChannel[0].id],
        },
    });

    logger.info("Seeding product data...");
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Create Categories
    const categoriesData = [
        { name: "Prescription Medicines", is_active: true },
        { name: "Over-the-Counter (OTC)", is_active: true },
        { name: "Vitamins & Supplements", is_active: true },
        { name: "Personal Care", is_active: true },
        { name: "Medical Devices", is_active: true }
    ];

    const existingCategories = await productModuleService.listProductCategories({
        name: categoriesData.map(c => c.name)
    });

    let categoryResult = existingCategories;
    if (existingCategories.length < categoriesData.length) {
        const { result } = await createProductCategoriesWorkflow(container).run({
            input: {
                product_categories: categoriesData
            }
        });
        categoryResult = result;
    }

    const categoryMap = new Map(categoryResult.map(c => [c.name, c.id]));

    // Create Products
    try {
        const { result: products } = await createProductsWorkflow(container).run({
            input: {
                products: [
                    {
                        title: "Paracetamol 500mg",
                        category_ids: (categoryMap.has("Over-the-Counter (OTC)") ? [categoryMap.get("Over-the-Counter (OTC)")!] : []) as string[],
                        description: "Effective pain reliever and fever reducer.",
                        handle: "paracetamol-500mg",
                        weight: 50,
                        status: ProductStatus.PUBLISHED,
                        shipping_profile_id: shippingProfile.id,
                        options: [{ title: "Pack Size", values: ["10 Tablets", "20 Tablets"] }],
                        variants: [
                            {
                                title: "10 Tablets",
                                sku: "PARA-500-10",
                                options: { "Pack Size": "10 Tablets" },
                                prices: [{ amount: 5, currency_code: "usd" }, { amount: 400, currency_code: "inr" }]
                            },
                            {
                                title: "20 Tablets",
                                sku: "PARA-500-20",
                                options: { "Pack Size": "20 Tablets" },
                                prices: [{ amount: 9, currency_code: "usd" }, { amount: 750, currency_code: "inr" }]
                            }
                        ],
                        sales_channels: [{ id: defaultSalesChannel[0].id }],
                    },
                    {
                        title: "Vitamin C 1000mg",
                        category_ids: (categoryMap.has("Vitamins & Supplements") ? [categoryMap.get("Vitamins & Supplements")!] : []) as string[],
                        description: "Immune support supplement.",
                        handle: "vitamin-c-1000mg",
                        weight: 100,
                        status: ProductStatus.PUBLISHED,
                        shipping_profile_id: shippingProfile.id,
                        options: [{ title: "Quantity", values: ["60 Tablets"] }],
                        variants: [
                            {
                                title: "60 Tablets",
                                sku: "VITC-1000-60",
                                options: { "Quantity": "60 Tablets" },
                                prices: [{ amount: 15, currency_code: "usd" }, { amount: 1200, currency_code: "inr" }]
                            }
                        ],
                        sales_channels: [{ id: defaultSalesChannel[0].id }],
                    },
                    {
                        title: "Digital Thermometer",
                        category_ids: (categoryMap.has("Medical Devices") ? [categoryMap.get("Medical Devices")!] : []) as string[],
                        description: "Fast and accurate digital thermometer.",
                        handle: "digital-thermometer",
                        weight: 150,
                        status: ProductStatus.PUBLISHED,
                        shipping_profile_id: shippingProfile.id,
                        options: [{ title: "Color", values: ["White"] }],
                        variants: [
                            {
                                title: "White",
                                sku: "THERM-DIGI",
                                options: { "Color": "White" },
                                prices: [{ amount: 20, currency_code: "usd" }, { amount: 1600, currency_code: "inr" }]
                            }
                        ],
                        sales_channels: [{ id: defaultSalesChannel[0].id }],
                    },
                    {
                        title: "Moisturizing Lotion",
                        category_ids: (categoryMap.has("Personal Care") ? [categoryMap.get("Personal Care")!] : []) as string[],
                        description: "Daily moisturizing lotion for dry skin.",
                        handle: "moisturizing-lotion",
                        weight: 300,
                        status: ProductStatus.PUBLISHED,
                        shipping_profile_id: shippingProfile.id,
                        options: [{ title: "Size", values: ["200ml", "500ml"] }],
                        variants: [
                            {
                                title: "200ml",
                                sku: "LOTION-200",
                                options: { "Size": "200ml" },
                                prices: [{ amount: 12, currency_code: "usd" }, { amount: 900, currency_code: "inr" }]
                            },
                            {
                                title: "500ml",
                                sku: "LOTION-500",
                                options: { "Size": "500ml" },
                                prices: [{ amount: 22, currency_code: "usd" }, { amount: 1800, currency_code: "inr" }]
                            }
                        ],
                        sales_channels: [{ id: defaultSalesChannel[0].id }],
                    }
                ],
            },
        });

        const pharmaService = container.resolve("pharma") as PharmaService;
        const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

        for (const product of products) {
            let pharmaData = {};
            if (product.handle === "paracetamol-500mg") {
                pharmaData = {
                    is_prescription_required: false,
                    composition: "Paracetamol 500mg",
                    manufacturer: "HealthCorp",
                    dosage_form: "Tablet"
                };
            } else if (product.handle === "vitamin-c-1000mg") {
                pharmaData = {
                    is_prescription_required: false,
                    composition: "Ascorbic Acid 1000mg",
                    manufacturer: "VitaLife",
                    dosage_form: "Tablet"
                };
            } else {
                continue;
            }

            const pharmaProduct = await pharmaService.createPharmaProducts(pharmaData);

            await remoteLink.create({
                [Modules.PRODUCT]: {
                    product_id: product.id,
                },
                "pharma": {
                    pharma_product_id: pharmaProduct.id,
                },
            });
        }

    } catch (e) {
        logger.info("Products might already exist. Continuing...");
    }

    logger.info("Finished seeding Suprameds data.");
}
