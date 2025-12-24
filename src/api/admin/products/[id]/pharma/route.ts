import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import PharmaService from "../../../../../modules/pharma/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: [product] } = await query.graph({
        entity: "product",
        fields: ["pharma_product.*"],
        filters: {
            id: id,
        },
    })

    const pharmaData = product && (product as any).pharma_product ? 
        (Array.isArray((product as any).pharma_product) ? (product as any).pharma_product[0] : (product as any).pharma_product) 
        : null

    res.json({ pharma: pharmaData })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const pharmaService = req.scope.resolve("pharma") as PharmaService
    const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // 1. Check if existing link exists
    const { data: [product] } = await query.graph({
        entity: "product",
        fields: ["pharma_product.*"],
        filters: {
            id: id,
        },
    })

    let pharmaProduct
    const existingPharma = product && (product as any).pharma_product ? 
        (Array.isArray((product as any).pharma_product) ? (product as any).pharma_product[0] : (product as any).pharma_product) 
        : null

    if (existingPharma) {
        // Update existing
        pharmaProduct = await pharmaService.updatePharmaProducts({
            id: existingPharma.id,
            ...(req.body as any),
        })
    } else {
        // Create new
        pharmaProduct = await pharmaService.createPharmaProducts(req.body as any)

        // Link it
        await remoteLink.create({
            [Modules.PRODUCT]: {
                product_id: id,
            },
            "pharma": {
                pharma_product_id: pharmaProduct.id,
            },
        })
    }

    res.json({ pharma: pharmaProduct })
}
