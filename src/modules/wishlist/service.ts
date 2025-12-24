import { MedusaService } from "@medusajs/framework/utils"
import { Wishlist, WishlistItem } from "./models/wishlist"

class WishlistService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {}

export default WishlistService
