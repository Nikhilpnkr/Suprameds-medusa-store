import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updatePrescriptionWorkflow } from "../../../../../workflows/prescription/update-prescription"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updatePrescriptionWorkflow(req.scope).run({
    input: {
        id,
        status: (req.body as any).status, // APPROVED or REJECTED
        rejection_reason: (req.body as any).rejection_reason,
        verified_by: "admin_user", // Get from auth context
    },
  })

  res.json({ prescription: result })
}
