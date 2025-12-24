import { model } from "@medusajs/framework/utils"

export const Wishlist = model.define("wishlist", {
  id: model.id().primaryKey(),
  region_id: model.text().nullable(),
  customer_id: model.text().nullable(), // For reference, though link handles relationship
  items: model.hasMany(() => WishlistItem, {
    mappedBy: "wishlist",
  }),
})

export const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  wishlist: model.belongsTo(() => Wishlist, {
    mappedBy: "items",
  }),
  variant_id: model.text(), // We'll store this to keep it simple, but also link it
  quantity: model.number().default(1),
  metadata: model.json().nullable(),
})
