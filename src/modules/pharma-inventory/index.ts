import { Module } from "@medusajs/framework/utils"
import PharmaInventoryService from "./service"

export const PHARMA_INVENTORY_MODULE = "pharma_inventory"

export default Module(PHARMA_INVENTORY_MODULE, {
    service: PharmaInventoryService,
})
