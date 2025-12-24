import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRESCRIPTION_MODULE } from "../../../modules/prescription"

export const updatePrescriptionStep = createStep(
    "update-prescription-step",
    async (input: {
        id: string
        status?: "PENDING" | "APPROVED" | "REJECTED"
        rejection_reason?: string
        verified_by?: string
    }, { container }) => {
        const prescriptionService = container.resolve(PRESCRIPTION_MODULE) as any
        // createPrescriptions handles updates if ID is provided in some patterns, 
        // but typically we use updatePrescriptions. 
        // Medusa Service factory generates update[Model]s
        const prescription = await prescriptionService.updatePrescriptions(input)
        return new StepResponse(prescription, { id: input.id, ...prescription }) // Compensator needs old data, simplifying here
    },
    async (prevData, { container }) => {
        // Compensation logic (revert update)
        // Simplified for now
    }
)
