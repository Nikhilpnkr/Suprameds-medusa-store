
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { importPharmaProductsWorkflow } from "../workflows/import/import-pharma-products"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedMcpPharma({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fulfillmentModuleService = container.resolve("fulfillment")
  const salesChannelModuleService = container.resolve("sales_channel")
  const stockLocationService = container.resolve("stock_location")
  const inventoryItemService = container.resolve("inventory_item")

  logger.info("💊 Starting MCP-based pharma data seeding (120 products with INR pricing)...")

  // Fetch Shipping Profile & Sales Channel
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" })
  const shippingProfileId = shippingProfiles[0]?.id

  const salesChannels = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" })
  const salesChannelId = salesChannels[0]?.id

  if (!shippingProfileId || !salesChannelId) {
      logger.error("❌ Pre-requisites missing: Default Shipping Profile or Sales Channel not found.")
      return
  }
  
  logger.info(`✅ Using Shipping Profile: ${shippingProfileId}`)
  logger.info(`✅ Using Sales Channel: ${salesChannelId}`)

  // Ensure Indian Warehouse stock location exists
  let stockLocationId: string | undefined
  const locations = await stockLocationService.listStockLocations({ name: "Indian Warehouse" })
  if (locations.length > 0) {
    stockLocationId = locations[0].id
    logger.info(`✅ Found existing Indian Warehouse: ${stockLocationId}`)
  } else {
    const newLocation = await stockLocationService.createStockLocations({
      name: "Indian Warehouse",
      address: {
        address_1: "123 Pharma Street",
        city: "Mumbai",
        country_code: "IN",
        postal_code: "400001"
      }
    })
    stockLocationId = newLocation.id
    logger.info(`✅ Created Indian Warehouse: ${stockLocationId}`)
  }

  const categories = [
    { name: 'Pain Relief', code: 'CALPOL', type: 'Tablet' },
    { name: 'Antibiotics', code: 'AMOX', type: 'Capsule' },
    { name: 'Vitamins', code: 'VIT', type: 'Tablet' },
    { name: 'Skincare', code: 'DERM', type: 'Gel' },
    { name: 'First Aid', code: 'BAND', type: 'Cream' },
    { name: 'Respiratory', code: 'COUGH', type: 'Syrup' },
    { name: 'Diabetes', code: 'INS', type: 'Injection' },
    { name: 'Cardiology', code: 'HRT', type: 'Tablet' },
    { name: 'Gastrointestinal', code: 'GAS', type: 'Syrup' },
    { name: 'Neurology', code: 'NEURO', type: 'Tablet' },
  ]

  const forms = [
    { form: 'Tablet', unit: 'Strip', pack: '10 Tablets / Strip' },
    { form: 'Capsule', unit: 'Strip', pack: '10 Capsules / Strip' },
    { form: 'Syrup', unit: 'Bottle', pack: '100ml Bottle' },
    { form: 'Gel', unit: 'Tube', pack: '30g Tube' },
    { form: 'Cream', unit: 'Tube', pack: '15g Tube' },
    { form: 'Spray', unit: 'Bottle', pack: '50ml Spray Bottle' },
    { form: 'Injection', unit: 'Vial', pack: '10ml Vial' },
    { form: 'Drop', unit: 'Bottle', pack: '15ml Drop Bottle' },
  ]

  const manufacturers = ['Sun Pharma', 'Cipla', "Dr. Reddy's", 'Zydus Cadila', 'Glenmark', 'Lupin', 'Torrent Pharma', 'Alkem Labs']

  const products = []

  for (let i = 0; i < 120; i++) {
    const category = categories[i % categories.length]
    const form = forms.find(f => f.form === category.type) || forms[0]
    const manufacturer = manufacturers[i % manufacturers.length]
    const isRx = i % 3 === 0
    const price = (Math.random() * 50 + 5).toFixed(2)
    const stock = Math.floor(Math.random() * 500) + 10
    const strength = Math.floor(Math.random() * 500) + 100

    // Create readable SKU format: CATEGORY-FORM-NUMBER-STRENGTH
    const formCode = {
      'Tablet': 'TAB',
      'Capsule': 'CAP',
      'Syrup': 'SYR',
      'Gel': 'GEL',
      'Cream': 'CRM',
      'Spray': 'SPR',
      'Injection': 'INJ',
      'Drop': 'DRP'
    }[form.form] || 'MED'
    
    const productNumber = (i + 1).toString().padStart(3, '0')
    const readableSKU = `${category.code}-${formCode}-${productNumber}-${strength}MG`

    const nameBasis = `${category.name} ${form.form} ${i + 1}`
    const title = `${nameBasis} ${strength}mg [${readableSKU}]`

    products.push({
      title,
      description: `Comprehensive treatment for ${category.name}. Clinically proven ${form.form.toLowerCase()} formulation.`,
      handle: `${category.code.toLowerCase()}-${formCode.toLowerCase()}-${productNumber}-${strength}mg`,
      shipping_profile_id: shippingProfileId,
      sales_channel_id: salesChannelId,
      price: price, // Base price in EUR/USD equivalent
      stock_quantity: stock.toString(),
      variant_sku: readableSKU,
      pack_size_label: form.pack,
      images: `https://dummyimage.com/600x600/2ab1af/ffffff?text=${encodeURIComponent(title)}`,
      
      // Pharma-specific fields
      brand_name: `${title.split(' ')[0]}Brand`,
      generic_name: `${category.name} Generic Base API`,
      company_name: manufacturer,
      marketer_name: `${manufacturer} Marketing Div`,
      therapeutic_class: category.name,
      atc_code: `A${i}B${i}`,
      hsn_code: '30049099',
      strength: `${strength}mg`,
      strength_unit: 'mg',
      dosage_form: form.form,
      route_of_administration: form.form === 'Injection' ? 'Intravenous' : 'Oral',
      pack_type: form.unit,
      net_weight: '100',
      net_weight_unit: 'g',
      is_prescription_required: isRx ? 'true' : 'false',
      is_narcotic: 'false',
      is_psychotropic: 'false',
      is_habit_forming: 'false',
      schedule_type: isRx ? 'H' : 'OTC',
      drug_license_no: `DL-${manufacturer.substring(0, 3).toUpperCase()}-${i}`,
      fssai_license: '1001234567890',
      indication: `Indicated for the treatment of mild to moderate ${category.name.toLowerCase()} conditions.`,
      contraindication: 'Hypersensitivity to the active substance.',
      mechanism_of_action: 'Inhibits specific receptors to alleviate symptoms.',
      side_effects_detailed: 'Nausea, headache, dizziness (rare).',
      drug_interactions_detailed: 'May interact with alcohol and blood thinners.',
      alcohol_safety: 'Avoid',
      pregnancy_safety: 'Consult Doctor',
      lactation_safety: 'Safe if prescribed',
      driving_safety: 'May cause drowsiness',
      kidney_safety: 'Caution',
      liver_safety: 'Caution',
      storage_temperature: 'Store below 25°C',
      storage_instructions: 'Keep out of reach of children. Store in a cool, dry place.',
      shelf_life_months: '24',
      composition: `${category.name} Active Ingredient`,
      manufacturer,
      country_of_origin: 'India',
      side_effects: 'Nausea,Headache',
      drug_interactions: 'Alcohol',
    })
  }

  logger.info(`Generated ${products.length} product records. Running workflow...`)

  try {
    const { result } = await importPharmaProductsWorkflow(container).run({
      input: {
        data: products
      }
    })
    
    logger.info(`✅ Successfully seeded ${result.length} pharma products!`)

    // ---- Inventory Level Creation ----
    try {
      if (!stockLocationId) {
        logger.warn("⚠️ Indian Warehouse stock location not found. Skipping inventory level creation.")
      } else {
        // Fetch all inventory items and create levels
        const inventoryItems = await inventoryItemService.listInventoryItems({})
        const inventoryLevels = inventoryItems.map(item => ({
          location_id: stockLocationId,
          inventory_item_id: item.id,
          stocked_quantity: 1000,
        }))
        if (inventoryLevels.length > 0) {
          await createInventoryLevelsWorkflow(container).run({
            input: { inventory_levels: inventoryLevels },
          })
          logger.info(`✅ Created ${inventoryLevels.length} inventory levels linked to Indian Warehouse.`)
        } else {
          logger.warn("⚠️ No inventory items found. Inventory levels not created.")
        }
      }
    } catch (invError) {
      logger.error("❌ Failed to create inventory levels:", invError)
    }

  } catch (error) {
    logger.error("❌ Seeding failed:", error)
    throw error
  }
}
