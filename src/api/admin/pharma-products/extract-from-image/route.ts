import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GoogleGenerativeAI, Part } from "@google/generative-ai"

type ExtractRequest = {
  image: string // base64 encoded image
}

type ExtractedData = {
  productName: string | null
  brandName: string | null
  genericName: string | null
  manufacturer: string | null
  strength: string | null
  strengthUnit: string | null
  dosageForm: string | null
  packSize: string | null
  packType: string | null
  drugLicenseNo: string | null
  scheduleType: string | null
  price: string | null
  category: string | null
  therapeuticClass: string | null
  indication: string | null
  composition: string | null
  mechanismOfAction: string | null
  storageInstructions: string | null
  pregnancySafety: string | null
  lactationSafety: string | null
  alcoholSafety: string | null
  drivingSafety: string | null
  description: string | null
}

export const POST = async (
  req: MedusaRequest<ExtractRequest>,
  res: MedusaResponse
) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: "No image provided" })
    }

    // Check if API key is configured
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Google AI API key not configured. Please add GOOGLE_AI_API_KEY to your .env file." 
      })
    }

    // Initialize Gemini with Search Tool
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ googleSearch: {} }] // Enable Web Search
    })

    // Prepare the prompt
    const prompt = `Analyze this pharmaceutical product image. Use Google Search to find additional details (manufacturer, composition, side effects, storage) if not clearly visible on the package. Ensure extracted data is accurate by cross-referencing with online medical databases.

Extract these details:
- Product name (full product name as shown)
- Brand name (commercial/brand name)
- Generic name (chemical/generic name)
- Manufacturer (Company name - search if not visible)
- Strength (e.g. 500)
- Strength Unit (mg, g, ml, mcg, %)
- Dosage Form (Tablet, Capsule, Syrup, Gel, Injection, etc.)
- Pack Size (e.g. 10 Tablets / Strip)
- Pack Type (Strip, Bottle, Tube, Box)
- Drug License No (search if not visible)
- Schedule Type (Schedule H, H1, X, G, or OTC)
- Price (MRP)
- Category (Pain Relief, Antibiotics, Vitamins, Skincare, First Aid, Respiratory, Diabetes, Cardiology, Gastrointestinal, or Neurology)
- Therapeutic Class (e.g., Analgesic, Antibiotic)
- Indication (Uses)
- Composition (Visual or Search)
- Mechanism of Action (Search)
- Storage Instructions (Search)
- Pregnancy Safety (Search)
- Lactation Safety (Search)
- Alcohol Safety (Search)
- Driving Safety (Search)
- Description (Professional description)

Return ONLY a valid JSON object with these exact keys (use null for any field that is not visible or cannot be determined):
{
  "productName": "",
  "brandName": "",
  "genericName": "",
  "manufacturer": "",
  "strength": "",
  "strengthUnit": "",
  "dosageForm": "",
  "packSize": "",
  "packType": "",
  "drugLicenseNo": "",
  "scheduleType": "",
  "price": "",
  "category": "",
  "therapeuticClass": "",
  "indication": "",
  "composition": "",
  "mechanismOfAction": "",
  "storageInstructions": "",
  "contraindication": "",
  "sideEffects": "",
  "pregnancySafety": "",
  "lactationSafety": "",
  "alcoholSafety": "",
  "drivingSafety": "",
  "description": ""
}

Important: Return ONLY the JSON object, no other text.`

    // Remove data URL prefix if present
    const base64Image = image.includes(',') ? image.split(',')[1] : image
    
    const imagePart: Part = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    }

    console.log("Calling Gemini 1.5 Flash with Google Search...")
    
    // Call API using SDK
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error("No response from AI")
    }

    // Parse the JSON response
    let extractedData: ExtractedData
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extractedData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return res.status(500).json({ 
        error: "Failed to parse AI response. The image may not be clear enough.",
        raw: text 
      })
    }

    // Map to our form field names
    const mappedData = {
      category: mapCategory(extractedData.category),
      manufacturer: mapManufacturer(extractedData.manufacturer),
      description: extractedData.description || extractedData.composition || extractedData.productName || '',
      dosageForm: mapDosageForm(extractedData.dosageForm),
      strength: extractedData.strength,
      strengthUnit: mapStrengthUnit(extractedData.strengthUnit),
      packSize: extractedData.packSize,
      packType: extractedData.packType,
      productNumber: '001', // User will adjust this
      scheduleType: mapScheduleType(extractedData.scheduleType),
      isPrescriptionRequired: isPrescriptionCheck(extractedData.scheduleType),
      drugLicenseNo: extractedData.drugLicenseNo,
      fssaiLicense: '1001234567890',
      brandName: extractedData.brandName,
      genericName: extractedData.genericName,
      therapeuticClass: extractedData.therapeuticClass,
      composition: extractedData.composition || extractedData.genericName || '',
      indication: extractedData.indication || '',
      mechanismOfAction: extractedData.mechanismOfAction || '',
      contraindication: '', 
      sideEffects: '', 
      storageInstructions: extractedData.storageInstructions || 'Store in a cool, dry place below 25°C',
      pregnancySafety: extractedData.pregnancySafety || 'Consult Doctor',
      lactationSafety: extractedData.lactationSafety || 'Consult Doctor',
      alcoholSafety: extractedData.alcoholSafety || 'Avoid',
      drivingSafety: extractedData.drivingSafety || 'Safe',
      price: extractedData.price || '',
      stockQuantity: '1000',
    }

    return res.status(200).json({
      success: true,
      data: mappedData,
      raw: extractedData, // Include raw data for debugging
    })
  } catch (error: any) {
    console.error("Error extracting from image:", error)
    return res.status(500).json({
      error: error.message || "Failed to extract data from image",
    })
  }
}

// Helper function to map category names to codes
function mapCategory(categoryName: string | null): string {
  if (!categoryName) return ''
  
  const categoryMap: Record<string, string> = {
    'pain relief': 'Pain Relief',
    'antibiotics': 'Antibiotics',
    'vitamins': 'Vitamins',
    'skincare': 'Skincare',
    'first aid': 'First Aid',
    'respiratory': 'Respiratory',
    'diabetes': 'Diabetes',
    'cardiology': 'Cardiology',
    'gastrointestinal': 'Gastrointestinal',
    'neurology': 'Neurology',
  }
  
  const normalized = categoryName.toLowerCase()
  // Check for partial matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  return ''
}

// Helper to map manufacturer
function mapManufacturer(name: string | null): string {
  if (!name) return ''
  const validManufacturers = [
    "Sun Pharma", "Cipla", "Dr. Reddy's", "Zydus Cadila", 
    "Glenmark", "Lupin", "Torrent Pharma", "Alkem Labs"
  ]
  const normalized = name.toLowerCase()
  
  // Try exact match first
  const exact = validManufacturers.find(m => m.toLowerCase() === normalized)
  if (exact) return exact

  // Try partial match
  const partial = validManufacturers.find(m => 
    normalized.includes(m.toLowerCase()) || m.toLowerCase().includes(normalized)
  )
  return partial || name // Return original if no match (will become custom entry if form allows, or just show text)
}

// Helper to map dosage form
function mapDosageForm(form: string | null): string {
  if (!form) return ''
  const validForms = [
    "Tablet", "Capsule", "Syrup", "Gel", "Cream", 
    "Spray", "Injection", "Drop"
  ]
  const normalized = form.toLowerCase()
  
  // Create mapping for common variations
  const variations: Record<string, string> = {
    'tablets': 'Tablet', 'tabs': 'Tablet', 'tab': 'Tablet',
    'capsules': 'Capsule', 'caps': 'Capsule', 'cap': 'Capsule',
    'syrups': 'Syrup',
    'injections': 'Injection', 'inj': 'Injection',
    'drops': 'Drop', 'eye drop': 'Drop', 'ear drop': 'Drop',
    'creams': 'Cream',
    'gels': 'Gel',
    'sprays': 'Spray'
  }
  
  if (variations[normalized]) return variations[normalized]

  return validForms.find(f => f.toLowerCase() === normalized) || 
         validForms.find(f => normalized.includes(f.toLowerCase())) || 
         form // Return original text if no standard match found
}

// Helper for units
function mapStrengthUnit(unit: string | null): string {
  if (!unit) return 'mg'
  const normalized = unit.toLowerCase().trim()
  if (normalized === 'g' || normalized === 'gm') return 'g'
  if (normalized === 'ml') return 'ml'
  if (normalized === 'mcg') return 'mcg'
  return 'mg'
}

// Helper for schedule
function mapScheduleType(type: string | null): string {
  if (!type) return 'OTC'
  const normalized = type.toLowerCase()
  
  if (normalized.includes('schedule h') || normalized === 'h') return 'H'
  if (normalized.includes('schedule x') || normalized === 'x') return 'X'
  return 'OTC'
}

function isPrescriptionCheck(type: string | null): string | boolean {
    const s = mapScheduleType(type)
    return s !== 'OTC'
}
