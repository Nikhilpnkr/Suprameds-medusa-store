import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
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

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
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
  const existingRegions = await regionModuleService.listRegions({
    name: "Europe",
  });

  let region;
  if (existingRegions.length > 0) {
    region = existingRegions[0];
    logger.info("Region 'Europe' already exists. Using existing region.");
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe",
            currency_code: "eur",
            countries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
    logger.info("Finished seeding regions.");
  }

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions({
    country_code: countries,
  });

  if (existingTaxRegions.length === countries.length) {
    logger.info("Tax regions already exist. Skipping.");
  } else {
    // Only create missing tax regions or just skip if some exist to avoid complexity
    // For simplicity in this seed script, we'll try to create only if none exist, 
    // or we could filter. Let's assume if one exists, we skip for now to avoid errors.
    if (existingTaxRegions.length === 0) {
      await createTaxRegionsWorkflow(container).run({
        input: countries.map((country_code) => ({
          country_code,
          provider_id: "tp_system",
        })),
      });
      logger.info("Finished seeding tax regions.");
    } else {
      logger.info("Some tax regions exist. Skipping creation to avoid duplicates.");
    }
  }

  logger.info("Seeding stock location data...");
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const existingStockLocations = await stockLocationModuleService.listStockLocations({
    name: "European Warehouse",
  });

  let stockLocation;
  if (existingStockLocations.length > 0) {
    stockLocation = existingStockLocations[0];
    logger.info("Stock location 'European Warehouse' already exists. Using existing location.");
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container
    ).run({
      input: {
        locations: [
          {
            name: "European Warehouse",
            address: {
              city: "Copenhagen",
              country_code: "DK",
              address_1: "",
            },
          },
        ],
      },
    });
    stockLocation = stockLocationResult[0];
    logger.info("Finished seeding stock location data.");
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
    name: "European Warehouse delivery",
  });

  let fulfillmentSet;
  if (existingFulfillmentSets.length > 0) {
    fulfillmentSet = existingFulfillmentSets[0];
    logger.info("Fulfillment set 'European Warehouse delivery' already exists. Using existing set.");
  } else {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "European Warehouse delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Europe",
          geo_zones: [
            {
              country_code: "gb",
              type: "country",
            },
            {
              country_code: "de",
              type: "country",
            },
            {
              country_code: "dk",
              type: "country",
            },
            {
              country_code: "se",
              type: "country",
            },
            {
              country_code: "fr",
              type: "country",
            },
            {
              country_code: "es",
              type: "country",
            },
            {
              country_code: "it",
              type: "country",
            },
          ],
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

  // Check if shipping options exist (simple check by name)
  // Note: In a real scenario, we might want more robust checks, but for seeding, this prevents duplicates.
  // However, listing shipping options by name isn't directly available in the same way via simple service list sometimes without filters.
  // Let's assume if fulfillment set existed, we might skip, OR we just try/catch.
  // Better: list shipping options for the profile.

  // For this script, let's use a try-catch block for shipping options as it's complex to check all variations.
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
            description: "Ship in 2-3 days.",
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
        {
          name: "Express Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Express",
            description: "Ship in 24 hours.",
            code: "express",
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
    logger.info("Shipping options might already exist or failed to create. Continuing...");
  }
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const apiKeyModuleService = container.resolve(Modules.API_KEY);
  const existingApiKeys = await apiKeyModuleService.listApiKeys({
    title: "Webshop",
  });

  let publishableApiKey;
  if (existingApiKeys.length > 0) {
    publishableApiKey = existingApiKeys[0];
    logger.info("API Key 'Webshop' already exists. Using existing key.");
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
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");
  const productModuleService = container.resolve(Modules.PRODUCT);
  const existingCategories = await productModuleService.listProductCategories({
    name: ["Shirts", "Sweatshirts", "Pants", "Merch"],
  });

  let categoryResult;
  if (existingCategories.length === 4) {
    categoryResult = existingCategories;
    logger.info("Product categories already exist. Using existing categories.");
  } else {
    const { result } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: [
          {
            name: "Shirts",
            is_active: true,
          },
          {
            name: "Sweatshirts",
            is_active: true,
          },
          {
            name: "Pants",
            is_active: true,
          },
          {
            name: "Merch",
            is_active: true,
          },
        ],
      },
    });
    categoryResult = result;
  }

  logger.info(`Found ${categoryResult.length} categories: ${categoryResult.map(c => c.name).join(", ")}`);
  const categoryMap = new Map(categoryResult.map(c => [c.name, c.id]));

  try {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "Medusa T-Shirt",
            category_ids: (categoryMap.has("Shirts") ? [categoryMap.get("Shirts")!] : []) as string[],
            description:
              "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
            handle: "t-shirt",
            weight: 400,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png",
              },
            ],
            options: [
              {
                title: "Size",
                values: ["S", "M", "L", "XL"],
              },
              {
                title: "Color",
                values: ["Black", "White"],
              },
            ],
            variants: [
              {
                title: "S / Black",
                sku: "SHIRT-S-BLACK",
                options: {
                  Size: "S",
                  Color: "Black",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "S / White",
                sku: "SHIRT-S-WHITE",
                options: {
                  Size: "S",
                  Color: "White",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "M / Black",
                sku: "SHIRT-M-BLACK",
                options: {
                  Size: "M",
                  Color: "Black",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "M / White",
                sku: "SHIRT-M-WHITE",
                options: {
                  Size: "M",
                  Color: "White",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "L / Black",
                sku: "SHIRT-L-BLACK",
                options: {
                  Size: "L",
                  Color: "Black",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "L / White",
                sku: "SHIRT-L-WHITE",
                options: {
                  Size: "L",
                  Color: "White",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "XL / Black",
                sku: "SHIRT-XL-BLACK",
                options: {
                  Size: "XL",
                  Color: "Black",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "XL / White",
                sku: "SHIRT-XL-WHITE",
                options: {
                  Size: "XL",
                  Color: "White",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
            ],
            sales_channels: [
              {
                id: defaultSalesChannel[0].id,
              },
            ],
          },
          {
            title: "Medusa Sweatshirt",
            category_ids: (categoryMap.has("Sweatshirts") ? [categoryMap.get("Sweatshirts")!] : []) as string[],
            description:
              "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
            handle: "sweatshirt",
            weight: 400,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
              },
            ],
            options: [
              {
                title: "Size",
                values: ["S", "M", "L", "XL"],
              },
            ],
            variants: [
              {
                title: "S",
                sku: "SWEATSHIRT-S",
                options: {
                  Size: "S",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "M",
                sku: "SWEATSHIRT-M",
                options: {
                  Size: "M",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "L",
                sku: "SWEATSHIRT-L",
                options: {
                  Size: "L",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "XL",
                sku: "SWEATSHIRT-XL",
                options: {
                  Size: "XL",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
            ],
            sales_channels: [
              {
                id: defaultSalesChannel[0].id,
              },
            ],
          },
          {
            title: "Medusa Sweatpants",
            category_ids: (categoryMap.has("Pants") ? [categoryMap.get("Pants")!] : []) as string[],
            description:
              "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
            handle: "sweatpants",
            weight: 400,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
              },
            ],
            options: [
              {
                title: "Size",
                values: ["S", "M", "L", "XL"],
              },
            ],
            variants: [
              {
                title: "S",
                sku: "SWEATPANTS-S",
                options: {
                  Size: "S",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "M",
                sku: "SWEATPANTS-M",
                options: {
                  Size: "M",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "L",
                sku: "SWEATPANTS-L",
                options: {
                  Size: "L",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "XL",
                sku: "SWEATPANTS-XL",
                options: {
                  Size: "XL",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
            ],
            sales_channels: [
              {
                id: defaultSalesChannel[0].id,
              },
            ],
          },
          {
            title: "Medusa Shorts",
            category_ids: (categoryMap.has("Merch") ? [categoryMap.get("Merch")!] : []) as string[],
            description:
              "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
            handle: "shorts",
            weight: 400,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
              },
              {
                url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png",
              },
            ],
            options: [
              {
                title: "Size",
                values: ["S", "M", "L", "XL"],
              },
            ],
            variants: [
              {
                title: "S",
                sku: "SHORTS-S",
                options: {
                  Size: "S",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "M",
                sku: "SHORTS-M",
                options: {
                  Size: "M",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "L",
                sku: "SHORTS-L",
                options: {
                  Size: "L",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
              {
                title: "XL",
                sku: "SHORTS-XL",
                options: {
                  Size: "XL",
                },
                prices: [
                  {
                    amount: 10,
                    currency_code: "eur",
                  },
                  {
                    amount: 15,
                    currency_code: "usd",
                  },
                ],
              },
            ],
            sales_channels: [
              {
                id: defaultSalesChannel[0].id,
              },
            ],
          },
        ],
      },
    });
    logger.info("Finished seeding product data.");
  } catch (e) {
    logger.info("Original products might already exist or failed to create. Continuing...");
  }

  logger.info("Seeding Suprameds dummy data...");

  const existingPharmaCategories = await productModuleService.listProductCategories({
    name: "Medicines",
  });

  let medicinesCategoryId;
  if (existingPharmaCategories.length > 0) {
    medicinesCategoryId = existingPharmaCategories[0].id;
    logger.info("Category 'Medicines' already exists. Using existing category.");
  } else {
    const { result: pharmaCategoryResult } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [{ name: "Medicines", is_active: true }],
      },
    });
    medicinesCategoryId = pharmaCategoryResult[0].id;
  }

  const supramedsProducts: any[] = [];
  for (let i = 1; i <= 50; i++) {
    supramedsProducts.push({
      title: `Suprameds Product ${i}`,
      category_ids: [medicinesCategoryId],
      description: `This is a dummy pharmaceutical product ${i} for testing purposes.`,
      handle: `supra-product-${i}`,
      weight: 100,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Pack", values: ["Standard"] }],
      variants: [{
        title: "Standard Pack",
        sku: `SUPRA-${i}`,
        options: { Pack: "Standard" },
        prices: [
          { amount: 100 + i, currency_code: "eur" },
          { amount: 120 + i, currency_code: "usd" },
        ],
        metadata: {
          purchase_price: 50 + i,
          discount_type: i % 2 === 0 ? "percentage" : "flat",
          sale_discount: i % 2 === 0 ? 10 : 5,
          min_stock_quantity: 10,
          base_unit: "Strips",
          secondary_unit: "Tablets",
          conversion_rate: 10,
        }
      }],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
      metadata: {
        item_name: `Suprameds Product ${i}`,
      }
    });
  }

  try {
    const { result: createdProducts } = await createProductsWorkflow(container).run({
      input: { products: supramedsProducts },
    });
    logger.info("Finished seeding Suprameds dummy data.");

    logger.info("Seeding Pharma data for products...");
    const pharmaService = container.resolve("pharma");
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    for (const product of createdProducts) {
       try {
        const pharmaProduct = await pharmaService.createPharmaProducts({
            is_prescription_required: Math.random() < 0.3, // 30% chance
            composition: "Paracetamol 500mg, Caffeine 30mg",
            manufacturer: "Suprameds Labs",
            dosage_form: "Tablet",
            schedule_type: Math.random() < 0.2 ? "H" : "OTC",
            storage_temperature: "Store below 25°C",
            country_of_origin: "India",
            side_effects: ["Nausea", "Dizziness"],
            drug_interactions: ["Alcohol"],
        } as any);

        await remoteLink.create({
            [Modules.PRODUCT]: {
                product_id: product.id,
            },
            "pharma": {
                pharma_product_id: pharmaProduct.id,
            },
        });
       } catch (error) {
           logger.error(`Failed to seed pharma data for product ${product.id}: ${error.message}`);
       }
    }
    logger.info("Finished seeding Pharma data.");

  } catch (e) {
    logger.info("Suprameds products might already exist. Continuing...");
  }

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryModuleService = container.resolve(Modules.INVENTORY);
  const existingInventoryLevels = await inventoryModuleService.listInventoryLevels({
    location_id: stockLocation.id,
  });

  const existingInventoryItemIds = new Set(existingInventoryLevels.map((l) => l.inventory_item_id));

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    if (existingInventoryItemIds.has(inventoryItem.id)) {
      continue;
    }
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  if (inventoryLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    });
    logger.info(`Created ${inventoryLevels.length} new inventory levels.`);
  } else {
    logger.info("All inventory levels already exist. Skipping.");
  }

  logger.info("Finished seeding inventory levels data.");
}
