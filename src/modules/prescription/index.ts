import { Module } from "@medusajs/framework/utils"
import PrescriptionService from "./service"

export const PRESCRIPTION_MODULE = "prescription"

export default Module(PRESCRIPTION_MODULE, {
    service: PrescriptionService,
})
