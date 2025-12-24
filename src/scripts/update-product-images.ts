import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function updateProductImages({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)

  console.log("🔍 Listing all products...")
  const allProducts = await productService.listProducts({})
  console.log(`Found ${allProducts.length} products:`)
  allProducts.forEach(p => console.log(` - ${p.title} (ID: ${p.id}, Handle: ${p.handle})`))

  const updates = [
    {
      id: "prod_01KD2JCCJ6FQXK23KV3XBT2YJC", // Dolo 650
      thumbnail: "https://kolwcjqqgzzqqxvhxkpj.supabase.co/storage/v1/object/public/product-images/dolo-650.png",
      images: [{ url: "https://kolwcjqqgzzqqxvhxkpj.supabase.co/storage/v1/object/public/product-images/dolo-650.png" }]
    },
    {
      id: "prod_01KD2JCCJ6TVW736CJD45JSMH3", // Calpol 500
      thumbnail: "https://kolwcjqqgzzqqxvhxkpj.supabase.co/storage/v1/object/public/product-images/calpol-500.png",
      images: [{ url: "https://kolwcjqqgzzqqxvhxkpj.supabase.co/storage/v1/object/public/product-images/calpol-500.png" }]
    }
  ]

  for (const update of updates) {
    try {
      console.log(`Updating product ${update.id}...`)
      await productService.updateProducts(update.id, {
        thumbnail: update.thumbnail,
        images: update.images
      })
      console.log(`✅ Updated ${update.id} successfully!`)
    } catch (error) {
      console.error(`❌ Failed to update ${update.id}:`, error.message)
    }
  }
}
