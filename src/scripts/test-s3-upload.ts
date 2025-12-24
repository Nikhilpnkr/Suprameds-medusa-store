import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"

export default async function testS3Upload({ container }: ExecArgs) {
  console.log("🚀 Testing S3 Connection...")
  
  const fileModuleService = container.resolve(Modules.FILE)
  
  // Create a dummy file for testing
  const testFilePath = path.join(process.cwd(), "test-upload.txt")
  fs.writeFileSync(testFilePath, "Medusa S3 Connection Test - " + new Date().toISOString())
  
  try {
    console.log("📂 Uploading test file...")
    const file = await fileModuleService.createFiles({
      filename: "test-connectivity.txt",
      mimeType: "text/plain",
      content: fs.readFileSync(testFilePath).toString("base64")
    })
    
    console.log("✅ File uploaded successfully!")
    console.log("📁 File details:", JSON.stringify(file, null, 2))
    
    // Clean up local test file
    fs.unlinkSync(testFilePath)
  } catch (error) {
    console.error("❌ S3 Upload Failed:", error)
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath)
  }
}
