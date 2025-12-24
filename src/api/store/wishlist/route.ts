import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
// @ts-ignore
import { WISHLIST_MODULE } from "../../../modules/wishlist"
// @ts-ignore
import WishlistService from "../../../modules/wishlist/service"

export const GET = async (
  req: MedusaRequest, 
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const customer_id = req.auth_context?.actor_id

  if (!customer_id) {
     return res.status(401).json({ message: "Unauthorized" })
  }

  const { data: [wishlist] } = await query.graph({
    entity: "wishlist",
    fields: ["id", "items.*"],
    filters: {
      customer_id,
    },
  })

  res.json({ wishlist })
}

export const POST = async (
  req: MedusaRequest, 
  res: MedusaResponse
) => {
  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const customer_id = req.auth_context?.actor_id

  if (!customer_id) {
     return res.status(401).json({ message: "Unauthorized" })
  }

  const body = req.body as { variant_id: string }
  const variant_id = body.variant_id

  if (!variant_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variant ID is required")
  }

  let { data: [wishlist] } = await query.graph({
    entity: "wishlist",
    fields: ["id"],
    filters: {
      customer_id,
    },
  })

  // If no wishlist exists for this customer, create one
  if (!wishlist) {
    wishlist = await wishlistService.createWishlists({
      customer_id,
      region_id: "reg_123", // Ideally fetched from context or body
    })
  }

  // Check if item already exists to avoid duplicates (optional, based on logic)
  const { data: [existingItem] } = await query.graph({
      entity: "wishlist_item",
      fields: ["id"],
      filters: {
          wishlist_id: wishlist.id,
          variant_id: variant_id
      }
  })

  if (existingItem) {
      return res.json({ item: existingItem })
  }

  const item = await wishlistService.createWishlistItems({
    wishlist_id: wishlist.id,
    variant_id,
    quantity: 1,
  })

  res.json({ item })
}
