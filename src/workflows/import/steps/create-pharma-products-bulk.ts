
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import PharmaService from "../../../modules/pharma/service"

type CreatePharmaLinkInput = {
  product_id: string
  pharma_data: {
    schedule_type?: string
    storage_temperature?: string
    country_of_origin?: string
    composition?: string
    manufacturer?: string
    dosage_form?: string
    is_prescription_required?: boolean
    side_effects?: string[]
    drug_interactions?: string[]
  }
}

export const createPharmaProductsBulkStep = createStep(
  "create-pharma-products-bulk",
  async (inputs: CreatePharmaLinkInput[], { container }) => {
    const pharmaService: PharmaService = container.resolve("pharma")
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const createdPharmaProducts: any[] = []
    const links: any[] = []

    for (const input of inputs) {
      if (!input.pharma_data) continue

      const pharmaProduct = await pharmaService.createPharmaProducts(input.pharma_data as any)
      createdPharmaProducts.push(pharmaProduct)

      links.push({
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
        "pharma": {
          pharma_product_id: pharmaProduct.id,
        },
      })
    }

    if (links.length > 0) {
      await remoteLink.create(links)
    }

    return new StepResponse(createdPharmaProducts, createdPharmaProducts.map((p: any) => p.id))
  },
  async (createdIds: string[], { container }) => {
    if (!createdIds?.length) return
    const pharmaService: PharmaService = container.resolve("pharma")
    await pharmaService.deletePharmaProducts(createdIds)
  }
)
