
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Button, Text, Drawer, Input, Label, DatePicker, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

const ProductBatchWidget = () => {
    const { id } = useParams() // Product ID
    const [batches, setBatches] = useState<any[]>([])
    const [variants, setVariants] = useState<any[]>([])
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    // Form State
    const [selectedVariant, setSelectedVariant] = useState("")
    const [batchNumber, setBatchNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState<Date | null>(null)
    const [quantity, setQuantity] = useState("0")

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true)
            try {
                // Fetch Product to get variants
                const productRes = await fetch(`/admin/products/${id}?fields=variants.id,variants.title`)
                const productData = await productRes.json()
                const productVariants = productData.product?.variants || []
                setVariants(productVariants)
                
                if (productVariants.length === 0) {
                     setLoading(false)
                     return;
                }

                const batchRes = await fetch(`/admin/batches`) 
                const batchData = await batchRes.json()
                
                const productVariantIds = new Set(productVariants.map((v: any) => v.id))
                const relevantBatches = batchData.batches.filter((b: any) => productVariantIds.has(b.variant_id))
                
                setBatches(relevantBatches)
            } catch (e) {
                console.error("Failed to load batches", e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const handleCreate = async () => {
        if (!selectedVariant || !batchNumber || !expiryDate) {
            toast.error("Please fill all fields")
            return
        }

        try {
            const res = await fetch("/admin/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variant_id: selectedVariant,
                    batch_number: batchNumber,
                    expiry_date: expiryDate.toISOString(),
                    quantity: parseInt(quantity),
                })
            })

            if (res.ok) {
                toast.success("Batch created")
                setIsDrawerOpen(false)
                // Reload
                window.location.reload()
            } else {
                toast.error("Failed to create batch")
            }
        } catch (e) {
            toast.error("Error creating batch")
        }
    }

    if (!id) return null

    return (
        <Container className="p-4 border rounded-lg bg-ui-bg-base">
            <div className="flex items-center justify-between mb-4">
                <Heading level="h2">Batch Inventory</Heading>
                <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>Add Batch</Button>
            </div>

            {loading ? <Text>Loading...</Text> : (
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Batch No</Table.HeaderCell>
                            <Table.HeaderCell>Variant</Table.HeaderCell>
                            <Table.HeaderCell>Expiry</Table.HeaderCell>
                            <Table.HeaderCell>Qty</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {batches.map((batch) => {
                            const variant = variants.find(v => v.id === batch.variant_id)
                            return (
                                <Table.Row key={batch.id}>
                                    <Table.Cell>{batch.batch_number}</Table.Cell>
                                    <Table.Cell>{variant?.title || batch.variant_id}</Table.Cell>
                                    <Table.Cell>{new Date(batch.expiry_date).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>{batch.quantity}</Table.Cell>
                                </Table.Row>
                            )
                        })}
                        {batches.length === 0 && (
                            <Table.Row>
                                <Table.Cell {...({ colSpan: 4 } as any)} className="text-center text-ui-fg-muted">No batches found</Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            )}

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <Drawer.Content className="right-0 top-0 bottom-0 fixed w-[400px] bg-white border-l p-6 z-50 overflow-y-auto">
                    <Heading className="mb-4">Add Batch</Heading>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Label className="mb-1 block">Variant</Label>
                            <select 
                                className="w-full border p-2 rounded text-sm"
                                value={selectedVariant}
                                onChange={(e) => setSelectedVariant(e.target.value)}
                            >
                                <option value="">Select Variant</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.id}>{v.title}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <Label className="mb-1 block">Batch Number</Label>
                            <Input placeholder="B-12345" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                        </div>

                        <div>
                            <Label className="mb-1 block">Expiry Date</Label>
                            <DatePicker value={expiryDate} onChange={setExpiryDate} />
                        </div>

                        <div>
                            <Label className="mb-1 block">Quantity</Label>
                            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>

                        <Button onClick={handleCreate} className="w-full mt-2">Save Batch</Button>
                    </div>
                </Drawer.Content>
            </Drawer>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

export default ProductBatchWidget
