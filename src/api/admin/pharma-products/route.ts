import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { importPharmaProductsWorkflow } from "../../../workflows/import/import-pharma-products"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

type PharmaProductInput = {
  title: string
  description?: string
  handle: string
  variant_sku: string
  price: string
  stock_quantity: string
  brand_name?: string
  generic_name?: string
  company_name?: string
  marketer_name?: string
  therapeutic_class?: string
  dosage_form?: string
  strength?: string
  strength_unit?: string
  pack_size_label?: string
  pack_type?: string
  schedule_type?: string
  is_prescription_required?: string
  drug_license_no?: string
  fssai_license?: string
  indication?: string
  contraindication?: string
  side_effects?: string
  pregnancy_safety?: string
  lactation_safety?: string
  alcohol_safety?: string
  driving_safety?: string
}

export const POST = async (
  req: MedusaRequest<PharmaProductInput>,
  res: MedusaResponse
) => {
  try {
    const productData = req.body

    // Get required services
    const fulfillmentService = req.scope.resolve("fulfillment")
    const salesChannelService = req.scope.resolve("sales_channel")
    const stockLocationService = req.scope.resolve("stock_location")
    const inventoryService = req.scope.resolve("inventory")

    // Get shipping profile
    const fulfillmentSets = await fulfillmentService.listFulfillmentSets({})
    const shippingProfileId = fulfillmentSets[0]?.service_zones?.[0]?.shipping_options?.[0]?.shipping_profile_id

    // Get sales channel
    const salesChannels = await salesChannelService.listSalesChannels({})
    const salesChannelId = salesChannels[0]?.id

    // Get Indian Warehouse
    const locations = await stockLocationService.listStockLocations({ name: "Indian Warehouse" })
    const stockLocationId = locations[0]?.id

    // Generic fallback for Shipping Profile if not found in fulfillment sets
    let finalShippingProfileId = shippingProfileId
    if (!finalShippingProfileId) {
       // Try to find ANY shipping profile using the fulfillment service
       try {
         // Check if listShippingProfiles exists on the service (it should in v2)
         if ('listShippingProfiles' in fulfillmentService) {
            // @ts-ignore
            const profiles = await fulfillmentService.listShippingProfiles({})
            finalShippingProfileId = profiles[0]?.id
         }
       } catch (e) {
         console.warn("Could not list shipping profiles from fulfillment service:", e)
       }
    }

    console.log("Pharma Product Config Check:", {
      shippingProfileId: finalShippingProfileId,
      salesChannelId,
      stockLocationId
    })

    if (!finalShippingProfileId) {
      return res.status(400).json({
        error: "No Shipping Profile found. Please ensure you have at least one Shipping Profile created."
      })
    }
    
    if (!salesChannelId) {
      return res.status(400).json({
        error: "No Sales Channel found. Please ensure you have a default Sales Channel."
      })
    }
    
    if (!stockLocationId) {
      return res.status(400).json({
        error: "Indian Warehouse stock location not found. Please create a stock location named 'Indian Warehouse'."
      })
    }

    // Add required IDs to product data
    const completeProductData = {
      ...productData,
      shipping_profile_id: finalShippingProfileId,
      sales_channel_id: salesChannelId,
      images: `https://dummyimage.com/600x600/2ab1af/ffffff&text=${encodeURIComponent(productData.title)}`,
    }

    // Create the product using the workflow
    const { result } = await importPharmaProductsWorkflow(req.scope).run({
      input: {
        data: [completeProductData],
      },
    })

    // Get the created product
    const createdProduct = result?.[0]

    if (!createdProduct) {
      throw new Error("Product creation failed")
    }

    // Create inventory levels for the product
    try {
      // Get inventory items for the created product
      const inventoryItems = await inventoryService.listInventoryItems({})
      
      // Find the inventory item for this product's variant
      const productInventoryItems = inventoryItems.filter((item: any) => {
        // Match by SKU or other identifier
        return item.sku === productData.variant_sku
      })

      if (productInventoryItems.length > 0) {
        const inventoryLevels = productInventoryItems.map((item: any) => ({
          location_id: stockLocationId,
          inventory_item_id: item.id,
          stocked_quantity: parseInt(productData.stock_quantity) || 1000,
        }))

        await createInventoryLevelsWorkflow(req.scope).run({
          input: { inventory_levels: inventoryLevels },
        })
      }
    } catch (inventoryError: any) {
      console.warn("Inventory level creation failed (may already exist):", inventoryError)
      // Don't fail the whole request if inventory creation fails
    }

    return res.status(201).json({
      product: createdProduct,
      message: "Product created successfully"
    })
  } catch (error: any) {
    console.error("Error creating pharma product:", error)
    return res.status(500).json({
      error: error.message || "Failed to create product"
    })
  }
}
