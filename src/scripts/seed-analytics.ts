import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function seedAnalytics({ container }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const analyticsService = container.resolve("analytics")
  const prescriptionService = container.resolve("prescription")

  console.log("Seeding analytics data...")

  // Seed Daily Metrics for last 7 days
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    await analyticsService.createDailyMetrics({
        date: dateString,
        total_sales: Math.floor(Math.random() * 5000) + 1000,
        active_users: Math.floor(Math.random() * 50) + 10,
        top_products: ["Amoxicillin", "Paracetamol", "Vitamin C"]
    })
  }

  // Seed some Prescriptions
  const dummyPrescriptions = [
    { customer_id: "cus_1", image_url: "https://example.com/p1.jpg", status: "PENDING", patient_name: "John Doe" },
    { customer_id: "cus_2", image_url: "https://example.com/p2.jpg", status: "APPROVED", patient_name: "Jane Smith" },
    { customer_id: "cus_3", image_url: "https://example.com/p3.jpg", status: "PENDING", patient_name: "Bob Wilson" },
    { customer_id: "cus_4", image_url: "https://example.com/p4.jpg", status: "REJECTED", patient_name: "Alice Brown", rejection_reason: "Illegible handwriting" },
  ]

  for (const p of dummyPrescriptions) {
    await prescriptionService.createPrescriptions(p)
  }

  console.log("Analytics data seeded successfully.")
}
