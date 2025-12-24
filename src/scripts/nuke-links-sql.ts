import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function nukeLinksSql({ container }: ExecArgs) {
  try {
      // Resolve Knex/PG connection
      const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      
      console.log("🔍 Searching for Link Table...")
      const tables = await pgConnection.raw(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name LIKE '%sales_channel%stock_location%'
      `)
      
      if (tables.rows.length === 0) {
           console.log("❌ No link table found.")
           return
      }
      
      const targetTable = tables.rows[0].table_name
      console.log(`✅ Found Link Table: ${targetTable}`)
      
      // Count before
      const countRes = await pgConnection.raw(`SELECT count(*) FROM "${targetTable}"`)
      console.log(`ℹ️ Current Links: ${countRes.rows[0].count}`)
      
      // Execute Delete
      const deleteRes = await pgConnection.raw(`DELETE FROM "${targetTable}"`)
      console.log(`☢️ Deleted Rows: ${deleteRes.rowCount}`)
      
  } catch (e) {
      console.error("SQL Nuke Failed:", e)
  }
}
