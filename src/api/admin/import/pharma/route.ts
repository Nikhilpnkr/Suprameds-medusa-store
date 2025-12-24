
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { importPharmaProductsWorkflow } from "../../../../workflows/import/import-pharma-products"
import { parse } from "csv-parse/sync"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    // 1. Get raw body (CSV content)
    // For simplicity, we assume raw body or simple text/csv. 
    // If multipart/form-data, we need a parser like busboy or similar, or just read standard Stream if Next handles it.
    // Medusa 2.0 uses Hono or native Request/Response. 
    // Let's assume the user sends the CSV content directly in the body as "text/csv" or JSON with "csv_content" string.
    // Handling File Uploads in generic routes can be tricky without middleware.
    // Let's support a JSON body with { csv: "..." } for easiest testing via Bruno, or raw string body.
    
    let csvContent = ""

    if (req.headers["content-type"]?.includes("application/json")) {
        csvContent = (req.body as any).csv
    } else {
        // Assume raw text body
        // Reading raw body from Node/Medusa request might differ.
        // Let's stick to JSON { csv: "header1,header2..." } for safety in this demo.
        csvContent = (req.body as any).csv
    }

    if (!csvContent) {
        res.status(400).json({ message: "No CSV content found in body.csv" })
        return
    }

    // 2. Parse CSV
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    // 3. Execute Workflow
    const { result } = await importPharmaProductsWorkflow(req.scope).run({
        input: {
            data: records
        }
    })

    res.json({
        message: "Import started",
        created_count: result.length,
        products: result
    })
}
