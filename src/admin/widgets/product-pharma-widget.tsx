import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Textarea, toast, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"

const ProductPharmaWidget = ({ data }: { data: { id: string } }) => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const product_id = data.id

    // Form state
    const [composition, setComposition] = useState("")
    const [manufacturer, setManufacturer] = useState("")
    const [dosageForm, setDosageForm] = useState("")
    const [isPrescriptionRequired, setIsPrescriptionRequired] = useState(false)
    
    // New Fields
    const [scheduleType, setScheduleType] = useState("")
    const [storageTemperature, setStorageTemperature] = useState("")
    const [countryOfOrigin, setCountryOfOrigin] = useState("")
    const [sideEffects, setSideEffects] = useState("")
    const [drugInteractions, setDrugInteractions] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/admin/products/${product_id}/pharma`)
                const resData = await response.json()
                if (resData.pharma) {
                    setComposition(resData.pharma.composition || "")
                    setManufacturer(resData.pharma.manufacturer || "")
                    setDosageForm(resData.pharma.dosage_form || "")
                    setIsPrescriptionRequired(resData.pharma.is_prescription_required || false)
                    
                    // Set New Fields
                    setScheduleType(resData.pharma.schedule_type || "")
                    setStorageTemperature(resData.pharma.storage_temperature || "")
                    setCountryOfOrigin(resData.pharma.country_of_origin || "")
                    setSideEffects(resData.pharma.side_effects || "")
                    setDrugInteractions(resData.pharma.drug_interactions || "")
                }
            } catch (e) {
                console.error("Failed to fetch pharma data", e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [product_id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch(`/admin/products/${product_id}/pharma`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    composition,
                    manufacturer,
                    dosage_form: dosageForm,
                    is_prescription_required: isPrescriptionRequired,
                    // New Fields
                    schedule_type: scheduleType,
                    storage_temperature: storageTemperature,
                    country_of_origin: countryOfOrigin,
                    side_effects: sideEffects,
                    drug_interactions: drugInteractions
                }),
            })

            if (response.ok) {
                await response.json()
                // setPharmaData(data.pharma)
                toast.success("Success", {
                    description: "Pharma details saved successfully"
                })
            } else {
                throw new Error("Failed to save")
            }
        } catch (e) {
            toast.error("Error", {
                description: "Failed to save pharma details"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <Container>Loading Pharma Details...</Container>
    }

    return (
        <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Pharma Details</Heading>
                <Button variant="secondary" size="small" onClick={handleSave} isLoading={saving}>
                    Save
                </Button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>Composition</Label>
                        <Input
                            placeholder="e.g. Paracetamol 500mg"
                            value={composition}
                            onChange={(e) => setComposition(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Manufacturer</Label>
                        <Input
                            placeholder="e.g. HealthCorp"
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Label>Dosage Form</Label>
                        <Input
                            placeholder="e.g. Tablet, Syrup"
                            value={dosageForm}
                            onChange={(e) => setDosageForm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Label>Schedule Type</Label>
                        <Select value={scheduleType} onValueChange={setScheduleType}>
                            <Select.Trigger>
                                <Select.Value placeholder="Select Schedule" />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="H">Schedule H</Select.Item>
                                <Select.Item value="X">Schedule X</Select.Item>
                                <Select.Item value="OTC">OTC</Select.Item>
                            </Select.Content>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Storage Temperature</Label>
                        <Input
                            placeholder="e.g. Store below 25°C"
                            value={storageTemperature}
                            onChange={(e) => setStorageTemperature(e.target.value)}
                        />
                    </div>

                     <div className="flex flex-col gap-2">
                        <Label>Country of Origin</Label>
                        <Input
                            placeholder="e.g. India"
                            value={countryOfOrigin}
                            onChange={(e) => setCountryOfOrigin(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-2">
                        <Label>Side Effects</Label>
                        <Textarea
                            placeholder="e.g. Nausea, Dizziness (Comma separated)"
                            value={sideEffects}
                            onChange={(e) => setSideEffects(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-2">
                        <Label>Drug Interactions</Label>
                        <Textarea
                            placeholder="e.g. Alcohol, Aspirin (Comma separated)"
                            value={drugInteractions}
                            onChange={(e) => setDrugInteractions(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Switch
                            checked={isPrescriptionRequired}
                            onCheckedChange={setIsPrescriptionRequired}
                        />
                        <Label>Prescription Required</Label>
                    </div>
                </div>
            </div>
        </Container>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

export default ProductPharmaWidget
