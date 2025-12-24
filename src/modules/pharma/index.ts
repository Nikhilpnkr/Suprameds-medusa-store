import { Module } from "@medusajs/framework/utils"
import PharmaService from "./service"

export const PHARMA_MODULE = "pharma"

export default Module(PHARMA_MODULE, {
    service: PharmaService,
})
