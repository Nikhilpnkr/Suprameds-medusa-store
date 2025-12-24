import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updatePrescriptionStep } from "./steps/update-prescription"

export const updatePrescriptionWorkflow = createWorkflow(
    "update-prescription",
    (input: {
        id: string
        status?: "PENDING" | "APPROVED" | "REJECTED"
        rejection_reason?: string
        verified_by?: string
    }) => {
        const prescription = updatePrescriptionStep(input)
        return new WorkflowResponse(prescription)
    }
)
