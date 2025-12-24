import { ExecArgs } from "@medusajs/framework/types"

export default async function task({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve("fulfillment")
  
  console.log("--- Checking Fulfillment Sets (Stock Locations) ---")
  const sets = await fulfillmentModule.listFulfillmentSets({})
  console.log(JSON.stringify(sets, null, 2))

  console.log("--- Checking Shipping Profiles (via Fulfillment Module) ---")
  try {
      // @ts-ignore
      const profiles = await fulfillmentModule.listShippingProfiles({})
      console.log(JSON.stringify(profiles, null, 2))
  } catch (e) {
      console.log("Method listShippingProfiles not found on fulfillment module:", e.message)
      console.log("Keys on fulfillmentModule:", Object.keys(fulfillmentModule))
  }
}
