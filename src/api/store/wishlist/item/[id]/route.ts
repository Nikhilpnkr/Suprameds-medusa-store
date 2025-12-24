import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"
import WishlistService from "../../../../../modules/wishlist/service"

import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export const DELETE = async (
  req: MedusaRequest, 
  res: MedusaResponse
) => {
  const wishlistService = req.scope.resolve(WISHLIST_MODULE) as WishlistService
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const id = req.params.id

  const customer_id = req.auth_context?.actor_id

  if (!customer_id) {
     return res.status(401).json({ message: "Unauthorized" })
  }

  // Security check: Ensure item belongs to customer
  const { data: [item] } = await query.graph({
      entity: "wishlist_item",
      fields: ["wishlist.customer_id"],
      filters: {
          id,
      }
  })

  // If item doesn't exist or belongs to another customer
  if (!item || (item.wishlist as any)?.customer_id !== customer_id) {
      // Return success to avoid leaking existence, or 404
      return res.status(200).json({ success: true })
  }

  await wishlistService.deleteWishlistItems(id)

  res.status(200).json({ success: true })
}
