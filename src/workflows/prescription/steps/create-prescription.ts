import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRESCRIPTION_MODULE } from "../../../modules/prescription"

export const createPrescriptionStep = createStep(
    "create-prescription-step",
    async (input: {
        customer_id: string
        image_url: string
        doctor_name?: string
        patient_name?: string
    }, { container }) => {
        const prescriptionService = container.resolve(PRESCRIPTION_MODULE)
        const prescription = await (prescriptionService as any).createPrescriptions(input)
        return new StepResponse(prescription, prescription.id)
    },
    async (id, { container }) => {
        const prescriptionService = container.resolve(PRESCRIPTION_MODULE)
        await (prescriptionService as any).deletePrescriptions([id])
    }
)
