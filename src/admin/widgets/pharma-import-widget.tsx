
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast, Input, Label } from "@medusajs/ui"
import { useState } from "react"

const PharmaImportWidget = () => {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first.")
            return
        }

        setUploading(true)

        try {
            const text = await file.text()
            
            // Send as JSON as per our API implementation
            const response = await fetch("/admin/import/pharma", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ csv: text }),
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(`Import started! Created ${data.created_count} products.`)
                setFile(null)
                // Optional: Trigger a refresh of the list if possible, or just user manual refresh
            } else {
                toast.error("Failed to import products.")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred during upload.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Container className="mb-4 p-4 border rounded-lg bg-ui-bg-base">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <Heading level="h2">Bulk Import Pharma Products</Heading>
                    <Text className="text-ui-fg-subtle">
                        Upload a CSV file to create products with Pharma details.
                    </Text>
                </div>

                <div className="flex items-end gap-3 max-w-md">
                    <div className="w-full">
                        <Label htmlFor="csv-upload" className="mb-1 block">CSV File</Label>
                        <Input 
                            id="csv-upload" 
                            type="file" 
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </div>
                    <Button 
                        onClick={handleUpload} 
                        disabled={!file || uploading}
                        isLoading={uploading}
                    >
                        Import
                    </Button>
                </div>
                {uploading && <Text className="text-xs text-ui-fg-muted">Processing... this may take a moment.</Text>}
            </div>
        </Container>
    )
}

// Inject before the main product list
export const config = defineWidgetConfig({
    zone: "product.list.before",
})

export default PharmaImportWidget
