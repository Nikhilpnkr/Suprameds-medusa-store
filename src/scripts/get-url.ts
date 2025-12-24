
import { ExecArgs } from "@medusajs/framework/types"

export default async function getUrl({ container }: ExecArgs) {
    console.log("DB URL: " + process.env.DATABASE_URL)
}
