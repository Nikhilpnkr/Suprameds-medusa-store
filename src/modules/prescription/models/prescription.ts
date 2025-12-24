import { model } from "@medusajs/framework/utils"

export const Prescription = model.define("prescription", {
    id: model.id().primaryKey(),
    customer_id: model.text(), // We'll link to Customer module via Remote Link later, but storing ID is good practice
    image_url: model.text(),
    doctor_name: model.text().nullable(),
    patient_name: model.text().nullable(),
    status: model.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
    rejection_reason: model.text().nullable(),
    verified_by: model.text().nullable(), // Admin User ID
})
