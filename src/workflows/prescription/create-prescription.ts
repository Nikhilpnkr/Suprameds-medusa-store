import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createPrescriptionStep } from "./steps/create-prescription"

export const createPrescriptionWorkflow = createWorkflow(
    "create-prescription",
    (input: {
        customer_id: string
        image_url: string
        doctor_name?: string
        patient_name?: string
    }) => {
        const prescription = createPrescriptionStep(input)
        return new WorkflowResponse(prescription)
    }
)
