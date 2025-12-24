
import { defineLink } from "@medusajs/framework/utils"
import PharmaInventoryModule from "../modules/pharma-inventory"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
    ProductModule.linkable.productVariant,
    {
        linkable: PharmaInventoryModule.linkable.productBatch,
        isList: true,
    }
)
