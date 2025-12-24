import { defineLink } from "@medusajs/framework/utils"
import PharmaModule from "../modules/pharma"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
    ProductModule.linkable.product,
    PharmaModule.linkable.pharmaProduct
)
