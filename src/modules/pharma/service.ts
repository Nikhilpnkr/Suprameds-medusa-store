import { MedusaService } from "@medusajs/framework/utils"
import { PharmaProduct } from "./models/pharma-product"

class PharmaService extends MedusaService({
    PharmaProduct,
}) { }

export default PharmaService
