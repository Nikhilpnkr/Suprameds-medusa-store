import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPrescriptionWorkflow } from "../../../workflows/prescription/create-prescription"
import { PRESCRIPTION_MODULE } from "../../../modules/prescription"
import PrescriptionService from "../../../modules/prescription/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const prescriptionService: PrescriptionService = req.scope.resolve(PRESCRIPTION_MODULE)

  const [prescriptions, count] = await prescriptionService.listPrescriptions({
    customer_id: req.auth_context.actor_id,
  })

  res.json({ prescriptions, count })
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { result } = await createPrescriptionWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      image_url: (req.body as any).image_url,
      doctor_name: (req.body as any).doctor_name,
      patient_name: (req.body as any).patient_name,
    },
  })

  res.json({ prescription: result })
}
