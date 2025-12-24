import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Switch,
  toast
} from "@medusajs/ui"
import { useState } from "react"
import { Plus } from "@medusajs/icons"

// Form data type
type PharmaProductForm = {
  // Basic Info
  category: string
  manufacturer: string
  description: string
  
  // Product Specs
  dosageForm: string
  strength: string
  strengthUnit: string
  packSize: string
  packType: string
  productNumber: string
  
  // Regulatory
  scheduleType: string
  isPrescriptionRequired: boolean
  drugLicenseNo: string
  fssaiLicense: string
  
  // Clinical
  brandName: string
  genericName: string
  therapeuticClass: string
  composition: string
  indication: string
  mechanismOfAction: string
  contraindication: string
  sideEffects: string
  storageInstructions: string
  
  // Safety
  pregnancySafety: string
  lactationSafety: string
  alcoholSafety: string
  drivingSafety: string
  
  // Pricing & Inventory
  price: string
  stockQuantity: string
}

const categories = [
  { value: "CALPOL", label: "Pain Relief" },
  { value: "AMOX", label: "Antibiotics" },
  { value: "VIT", label: "Vitamins" },
  { value: "DERM", label: "Skincare" },
  { value: "BAND", label: "First Aid" },
  { value: "COUGH", label: "Respiratory" },
  { value: "INS", label: "Diabetes" },
  { value: "HRT", label: "Cardiology" },
  { value: "GAS", label: "Gastrointestinal" },
  { value: "NEURO", label: "Neurology" },
]

const dosageForms = [
  { value: "Tablet", code: "TAB" },
  { value: "Capsule", code: "CAP" },
  { value: "Syrup", code: "SYR" },
  { value: "Gel", code: "GEL" },
  { value: "Cream", code: "CRM" },
  { value: "Spray", code: "SPR" },
  { value: "Injection", code: "INJ" },
  { value: "Drop", code: "DRP" },
]

const manufacturers = [
  "Sun Pharma",
  "Cipla",
  "Dr. Reddy's",
  "Zydus Cadila",
  "Glenmark",
  "Lupin",
  "Torrent Pharma",
  "Alkem Labs",
]

const AddPharmaProductWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractionStatus, setExtractionStatus] = useState<string>("")
  const [rawData, setRawData] = useState<any>(null)
  const [formData, setFormData] = useState<PharmaProductForm>({
    category: "",
    manufacturer: "",
    description: "",
    dosageForm: "",
    strength: "",
    strengthUnit: "mg",
    packSize: "",
    packType: "",
    productNumber: "001",
    scheduleType: "OTC",
    isPrescriptionRequired: false,
    drugLicenseNo: "",
    fssaiLicense: "1001234567890",
    brandName: "",
    genericName: "",
    therapeuticClass: "",
    composition: "",
    indication: "",
    mechanismOfAction: "",
    contraindication: "",
    sideEffects: "",
    storageInstructions: "Store in a cool, dry place below 25°C",
    pregnancySafety: "Consult Doctor",
    lactationSafety: "Consult Doctor",
    alcoholSafety: "Avoid",
    drivingSafety: "Safe",
    price: "",
    stockQuantity: "1000",
  })

  // Handle image upload with compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (warn if > 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Large Image", {
        description: "Image is large and will be compressed for faster processing.",
      })
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        // Create canvas to compress image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width
        let height = img.height
        const maxSize = 1200
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with 0.8 quality (good balance)
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8)
        
        setUploadedImage(compressedImage)
        setExtractionStatus("")
        
        // Show compression info
        const originalSize = (file.size / 1024).toFixed(0)
        const compressedSize = (compressedImage.length * 0.75 / 1024).toFixed(0) // Approximate
        console.log(`Image compressed: ${originalSize}KB → ${compressedSize}KB`)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Extract data from image using AI
  const handleExtractFromImage = async () => {
    if (!uploadedImage) {
      toast.error("No Image", {
        description: "Please upload an image first",
      })
      return
    }

    setIsExtracting(true)
    setExtractionStatus("Analyzing image...")

    try {
      const response = await fetch("/admin/pharma-products/extract-from-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: uploadedImage }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to extract data")
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        // Update form with extracted data
        setFormData({
          ...formData,
          ...result.data,
        })
        
        setRawData(result.raw) // Save raw data for display
        
        setExtractionStatus("✅ Extracted successfully!")
        toast.success("Data Extracted", {
          description: "Product information extracted from image. Please review and adjust if needed.",
        })
      } else {
        throw new Error("No data extracted from image")
      }
    } catch (error: any) {
      console.error("Error extracting from image:", error)
      setExtractionStatus("❌ Extraction failed")
      toast.error("Extraction Failed", {
        description: error.message || "Could not extract data from image. Please fill manually.",
      })
    } finally {
      setIsExtracting(false)
    }
  }


  // Generate SKU preview
  const generateSKU = () => {
    if (!formData.category || !formData.dosageForm || !formData.productNumber || !formData.strength) {
      return "SKU Preview"
    }
    const formCode = dosageForms.find(f => f.value === formData.dosageForm)?.code || "MED"
    const paddedNumber = formData.productNumber.padStart(3, '0')
    return `${formData.category}-${formCode}-${paddedNumber}-${formData.strength}${formData.strengthUnit.toUpperCase()}`
  }

  // Generate title
  const generateTitle = () => {
    if (!formData.category || !formData.dosageForm || !formData.productNumber || !formData.strength) {
      return ""
    }
    const categoryLabel = categories.find(c => c.value === formData.category)?.label || ""
    const sku = generateSKU()

    let mainName = categoryLabel
    if (formData.brandName) {
      mainName = formData.brandName
    } else if (formData.composition) {
      mainName = formData.composition
    }

    let compositionStr = ""
    if (formData.brandName && formData.composition) {
      compositionStr = ` ${formData.composition}`
    }

    return `${mainName}${compositionStr} ${formData.strength}${formData.strengthUnit} ${formData.dosageForm} [${sku}]`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const sku = generateSKU()
      const title = generateTitle()
      const categoryLabel = categories.find(c => c.value === formData.category)?.label || ""
      const formCode = dosageForms.find(f => f.value === formData.dosageForm)?.code || "med"
      const paddedNumber = formData.productNumber.padStart(3, '0')
      const handle = `${formData.category.toLowerCase()}-${formCode.toLowerCase()}-${paddedNumber}-${formData.strength}${formData.strengthUnit}`

      const productData = {
        title,
        description: formData.description,
        handle,
        variant_sku: sku,
        price: formData.price,
        stock_quantity: formData.stockQuantity,
        
        // Pharma fields
        brand_name: formData.brandName,
        generic_name: formData.genericName,
        company_name: formData.manufacturer,
        marketer_name: `${formData.manufacturer} Marketing Div`,
        therapeutic_class: formData.therapeuticClass || categoryLabel,
        composition: formData.composition,
        dosage_form: formData.dosageForm,
        strength: `${formData.strength}${formData.strengthUnit}`,
        strength_unit: formData.strengthUnit,
        pack_size_label: formData.packSize,
        pack_type: formData.packType,
        schedule_type: formData.scheduleType,
        is_prescription_required: formData.isPrescriptionRequired ? "true" : "false",
        drug_license_no: formData.drugLicenseNo,
        fssai_license: formData.fssaiLicense,
        indication: formData.indication,
        mechanism_of_action: formData.mechanismOfAction,
        contraindication: formData.contraindication,
        side_effects: formData.sideEffects,
        storage_instructions: formData.storageInstructions,
        pregnancy_safety: formData.pregnancySafety,
        lactation_safety: formData.lactationSafety,
        alcohol_safety: formData.alcoholSafety,
        driving_safety: formData.drivingSafety,
      }

      // Call the API to create the product
      const response = await fetch("/admin/pharma-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create product")
      }

      await response.json()
      
      toast.success("Product Created", {
        description: `Successfully created ${title}`,
      })

      // Reset form and close
      setFormData({
        category: "",
        manufacturer: "",
        description: "",
        dosageForm: "",
        strength: "",
        strengthUnit: "mg",
        packSize: "",
        packType: "",
        productNumber: "001",
        scheduleType: "OTC",
        isPrescriptionRequired: false,
        drugLicenseNo: "",
        fssaiLicense: "1001234567890",
        brandName: "",
        genericName: "",
        therapeuticClass: "",
        composition: "",
        indication: "",
        mechanismOfAction: "",
        contraindication: "",
        sideEffects: "",
        storageInstructions: "Store in a cool, dry place below 25°C",
        pregnancySafety: "Consult Doctor",
        lactationSafety: "Consult Doctor",
        alcoholSafety: "Avoid",
        drivingSafety: "Safe",
        price: "",
        stockQuantity: "1000",
      })
      setIsOpen(false)

      // Reload the page to show the new product
      window.location.reload()
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast.error("Error", {
        description: error.message || "Failed to create product. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Container className="mb-4">
        <Button
          onClick={() => setIsOpen(true)}
          variant="primary"
          className="w-full"
        >
          <Plus className="mr-2" />
          Add New Pharma Product
        </Button>
      </Container>
    )
  }

  return (
    <Container className="mb-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Heading level="h2">Add New Pharma Product</Heading>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <Heading level="h3" className="text-lg flex items-center gap-2">
              <span>📸</span> AI-Powered Image Recognition
            </Heading>
            
            <div className="space-y-3">
              <Label>Upload Medicine Package/Label Photo</Label>
              
              {/* Image Preview & Raw Data */}
              <div className={`grid gap-4 ${rawData ? 'grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* Left: Image */}
                <div className="relative">
                  {uploadedImage && (
                    <>
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded medicine" 
                        className="max-h-64 rounded-lg border-2 border-purple-300 w-full object-contain bg-gray-50"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setUploadedImage(null)
                          setExtractionStatus("")
                          setRawData(null)
                        }}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>

                {/* Right: Raw Data */}
                {rawData && (
                  <div className="flex flex-col h-full">
                    <Label className="mb-2 text-xs text-ui-fg-subtle uppercase">Raw AI Data</Label>
                    <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-3 flex-1 overflow-auto text-xs font-mono whitespace-pre-wrap max-h-64">
                      {JSON.stringify(rawData, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Input */}
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleExtractFromImage}
                  disabled={!uploadedImage || isExtracting}
                >
                  {isExtracting ? "Analyzing..." : "✨ Extract from Image"}
                </Button>
              </div>

              {/* Extraction Status */}
              {extractionStatus && (
                <div className={`p-3 rounded-lg ${
                  extractionStatus.includes("✅") 
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : extractionStatus.includes("❌")
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}>
                  {extractionStatus}
                </div>
              )}

              <p className="text-sm text-gray-600">
                💡 Tip: Upload a clear photo of the medicine package or label. AI will automatically extract product details.
              </p>
            </div>
          </div>

          {/* SKU Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Label className="text-sm font-medium text-blue-900">SKU Preview</Label>
            <p className="text-2xl font-bold text-blue-700 mt-1">{generateSKU()}</p>
            {generateTitle() && (
              <p className="text-sm text-blue-600 mt-2">Title: {generateTitle()}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Basic Information</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <Select.Trigger id="category">
                    <Select.Value placeholder="Select category" />
                  </Select.Trigger>
                  <Select.Content>
                    {categories.map((cat) => (
                      <Select.Item key={cat.value} value={cat.value}>
                        {cat.value}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <div className="relative">
                  <Input
                    id="manufacturer"
                    list="manufacturers-list"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Select or type manufacturer"
                    required
                  />
                  <datalist id="manufacturers-list">
                    {manufacturers.map((mfr) => (
                      <option key={mfr} value={mfr} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>

          {/* Product Specifications */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Product Specifications</Heading>
            
            <div className="grid grid-cols-3 gap-4">
              <div>

                <Label htmlFor="dosageForm">Dosage Form *</Label>
                <div className="relative">
                  <Input
                    id="dosageForm"
                    list="dosage-forms"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="Select or Type Dosage Form"
                    required
                  />
                  <datalist id="dosage-forms">
                    {dosageForms.map((form) => (
                      <option key={form.value} value={form.value} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <Label htmlFor="strength">Strength *</Label>
                <Input
                  id="strength"
                  type="number"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="250"
                  required
                />
              </div>

              <div>
                <Label htmlFor="strengthUnit">Unit</Label>
                <Select
                  value={formData.strengthUnit}
                  onValueChange={(value) => setFormData({ ...formData, strengthUnit: value })}
                >
                  <Select.Trigger id="strengthUnit">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="mg">mg</Select.Item>
                    <Select.Item value="g">g</Select.Item>
                    <Select.Item value="ml">ml</Select.Item>
                    <Select.Item value="mcg">mcg</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="productNumber">Product Number *</Label>
                <Input
                  id="productNumber"
                  type="text"
                  value={formData.productNumber}
                  onChange={(e) => setFormData({ ...formData, productNumber: e.target.value })}
                  placeholder="001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="packSize">Pack Size</Label>
                <Input
                  id="packSize"
                  value={formData.packSize}
                  onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                  placeholder="10 Tablets / Strip"
                />
              </div>

              <div>
                <Label htmlFor="packType">Pack Type</Label>
                <Input
                  id="packType"
                  value={formData.packType}
                  onChange={(e) => setFormData({ ...formData, packType: e.target.value })}
                  placeholder="Strip"
                />
              </div>
            </div>
          </div>

          {/* Regulatory */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Regulatory & Classification</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      scheduleType: value,
                      isPrescriptionRequired: value !== "OTC"
                    })
                  }}
                >
                  <Select.Trigger id="scheduleType">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="OTC">OTC (Over the Counter)</Select.Item>
                    <Select.Item value="H">Schedule H</Select.Item>
                    <Select.Item value="X">Schedule X</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isPrescriptionRequired"
                  checked={formData.isPrescriptionRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrescriptionRequired: checked })}
                />
                <Label htmlFor="isPrescriptionRequired">Prescription Required</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="drugLicenseNo">Drug License Number</Label>
                <Input
                  id="drugLicenseNo"
                  value={formData.drugLicenseNo}
                  onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                  placeholder="DL-XXX-123"
                />
              </div>

              <div>
                <Label htmlFor="fssaiLicense">FSSAI License</Label>
                <Input
                  id="fssaiLicense"
                  value={formData.fssaiLicense}
                  onChange={(e) => setFormData({ ...formData, fssaiLicense: e.target.value })}
                  placeholder="1001234567890"
                />
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Clinical Information</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Brand name"
                />
              </div>

              <div>
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="Generic name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="therapeuticClass">Therapeutic Class</Label>
              <Input
                id="therapeuticClass"
                value={formData.therapeuticClass}
                onChange={(e) => setFormData({ ...formData, therapeuticClass: e.target.value })}
                placeholder="e.g., Analgesic, Antibiotic"
              />
            </div>

            <div>
              <Label htmlFor="composition">Composition</Label>
              <Textarea
                id="composition"
                value={formData.composition}
                onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                placeholder="Active Ingredients (e.g., Paracetamol 500mg)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="indication">Indication</Label>
              <Textarea
                id="indication"
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                placeholder="What is this medicine used for?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="mechanismOfAction">Mechanism of Action</Label>
              <Textarea
                id="mechanismOfAction"
                value={formData.mechanismOfAction}
                onChange={(e) => setFormData({ ...formData, mechanismOfAction: e.target.value })}
                placeholder="How does it work?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="contraindication">Contraindication</Label>
              <Textarea
                id="contraindication"
                value={formData.contraindication}
                onChange={(e) => setFormData({ ...formData, contraindication: e.target.value })}
                placeholder="When should this medicine not be used?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="sideEffects">Side Effects</Label>
              <Textarea
                id="sideEffects"
                value={formData.sideEffects}
                onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                placeholder="Common side effects"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="storageInstructions">Storage Instructions</Label>
              <Input
                id="storageInstructions"
                value={formData.storageInstructions}
                onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                placeholder="e.g. Store below 25°C"
              />
            </div>
          </div>

          {/* Safety Information */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Safety Information</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pregnancySafety">Pregnancy Safety</Label>
                <Select
                  value={formData.pregnancySafety}
                  onValueChange={(value) => setFormData({ ...formData, pregnancySafety: value })}
                >
                  <Select.Trigger id="pregnancySafety">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="Safe">Safe</Select.Item>
                    <Select.Item value="Consult Doctor">Consult Doctor</Select.Item>
                    <Select.Item value="Unsafe">Unsafe</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label htmlFor="lactationSafety">Lactation Safety</Label>
                <Select
                  value={formData.lactationSafety}
                  onValueChange={(value) => setFormData({ ...formData, lactationSafety: value })}
                >
                  <Select.Trigger id="lactationSafety">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="Safe">Safe</Select.Item>
                    <Select.Item value="Consult Doctor">Consult Doctor</Select.Item>
                    <Select.Item value="Unsafe">Unsafe</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label htmlFor="alcoholSafety">Alcohol Safety</Label>
                <Select
                  value={formData.alcoholSafety}
                  onValueChange={(value) => setFormData({ ...formData, alcoholSafety: value })}
                >
                  <Select.Trigger id="alcoholSafety">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="Safe">Safe</Select.Item>
                    <Select.Item value="Caution">Caution</Select.Item>
                    <Select.Item value="Avoid">Avoid</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <Label htmlFor="drivingSafety">Driving Safety</Label>
                <Select
                  value={formData.drivingSafety}
                  onValueChange={(value) => setFormData({ ...formData, drivingSafety: value })}
                >
                  <Select.Trigger id="drivingSafety">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="Safe">Safe</Select.Item>
                    <Select.Item value="Caution">Caution</Select.Item>
                    <Select.Item value="Unsafe">Unsafe</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <Heading level="h3" className="text-lg">Pricing & Inventory</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (INR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="45.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Initial Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default AddPharmaProductWidget
