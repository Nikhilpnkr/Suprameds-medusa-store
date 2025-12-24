import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function setupMumbaiShipping({ container }: ExecArgs) {
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const remoteLink = container.resolve("remoteLink")
  const pricingModule = container.resolve(Modules.PRICING)

  console.log("🚀 Starting Mumbai Shipping Setup...")

  // 1. Get Stock Location
  const [location] = await stockLocationService.listStockLocations({ name: "Mumbai Warehouse" })
  if (!location) {
      console.error("❌ 'Mumbai Warehouse' not found! Please create it first.")
      return
  }
  console.log(`✅ Found Location: ${location.name} (${location.id})`)

  // 2. Create Fulfillment Set
  // We check if one exists linked to this location effectively, or just by name for simplicity
  let fulfillmentSet
  const sets = await fulfillmentModule.listFulfillmentSets({ name: "Mumbai Fulfillment" })
  if (sets.length > 0) {
      fulfillmentSet = sets[0]
      console.log(`ℹ️ Fulfillment Set 'Mumbai Fulfillment' already exists (${fulfillmentSet.id})`)
  } else {
      fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
          name: "Mumbai Fulfillment",
          type: "manual", // 'manual' type is standard for generic fulfillment
      })
      console.log(`✅ Created Fulfillment Set: ${fulfillmentSet.name} (${fulfillmentSet.id})`)
  }

  // 3. Link Fulfillment Set to Stock Location
  // We assume the link operates on FULFILLMENT_SET and STOCK_LOCATION. Note: In some v2 versions this is strictly done via Stock Location Service or Link.
  // Actually, the standard link is: STOCK_LOCATION <-> FULFILLMENT_SET
  try {
      await remoteLink.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
          [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
      })
      console.log("🔗 Linked Fulfillment Set to Stock Location")
  } catch (e) {
      console.log("ℹ️ Link might already exist.")
  }

  // 4. Create Service Zone (India)
  let serviceZone
  const zones = await fulfillmentModule.listServiceZones({ 
      name: "India", 
      fulfillment_set: { id: fulfillmentSet.id }
  })
  
  if (zones.length > 0) {
      serviceZone = zones[0]
      console.log(`ℹ️ Service Zone 'India' already exists (${serviceZone.id})`)
  } else {
      serviceZone = await fulfillmentModule.createServiceZones({
          name: "India",
          fulfillment_set_id: fulfillmentSet.id,
          geo_zones: [
              { type: "country", country_code: "in" }
          ]
      })
      console.log(`✅ Created Service Zone: India (${serviceZone.id})`)
  }

  // 5. Create Shipping Option
  let shippingOption
  const options = await fulfillmentModule.listShippingOptions({ 
      service_zone: { id: serviceZone.id },
      name: "Standard Shipping"
  })

  if (options.length > 0) {
      shippingOption = options[0]
      console.log(`ℹ️ Shipping Option 'Standard Shipping' already exists (${shippingOption.id})`)
  } else {
       // A. Fetch Shipping Profile
       const profiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
       let profileId = profiles[0]?.id
       if (!profileId) {
           // Create default profile if missing
           const newProfile = await fulfillmentModule.createShippingProfiles({
               name: "Default Profile",
               type: "default"
           })
           profileId = newProfile.id
           console.log(`✅ Created Default Shipping Profile (${profileId})`)
       } else {
           console.log(`ℹ️ Using Shipping Profile: ${profiles[0].name} (${profileId})`)
       }

       // B. Fetch Shipping Provider (Manual)
       // We need a provider that is installed. "manual_manual" is standard.
       // We can list providers if needed, but let's try "manual" or "manual_manual"
       
       shippingOption = await fulfillmentModule.createShippingOptions({
           name: "Standard Shipping",
           service_zone_id: serviceZone.id,
           shipping_profile_id: profileId,
           provider_id: "manual_manual", 
           type: {
               label: "Standard",
               description: "Standard Delivery",
               code: "standard",
           },
           price_type: "flat",
           rules: [],
           data: {}, 
       })
       console.log(`✅ Created Shipping Option: ${shippingOption.name} (${shippingOption.id})`)
       
       // 6. Set Price for Shipping Option
       const priceSet = await pricingModule.createPriceSets({
           prices: [
               {
                   amount: 500, 
                   currency_code: "eur", 
               },
               {
                    amount: 500,
                    currency_code: "inr"
               },
               {
                    amount: 600,
                    currency_code: "usd"
               }
           ]
       })
       
       await remoteLink.create({
           [Modules.FULFILLMENT]: { shipping_option_id: shippingOption.id },
           [Modules.PRICING]: { price_set_id: priceSet.id }
       })
       console.log(`✅ Linked Price (EUR, INR, USD) to Shipping Option`)
  }

  console.log("✨ Mumbai Shipping Setup Complete!")
}
