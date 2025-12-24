import { MedusaService } from "@medusajs/framework/utils"
import { Prescription } from "./models/prescription"

class PrescriptionService extends MedusaService({
    Prescription,
}) { }

export default PrescriptionService
