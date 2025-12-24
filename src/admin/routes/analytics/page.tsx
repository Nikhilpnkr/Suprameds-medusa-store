import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, StatusBadge } from "@medusajs/ui"
import { useEffect, useState } from "react"

const AnalyticsPage = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/admin/analytics")
        const json = await response.json()
        setData(json.analytics)
      } catch (e) {
        console.error("Failed to fetch analytics", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Text>Loading analytics...</Text>
  if (!data) return <Text>No analytics data available.</Text>

  return (
    <div className="flex flex-col gap-y-8 p-8">
      <Heading level="h1">Store Analytics</Heading>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Container className="p-4 flex flex-col gap-y-2">
            <Text className="text-ui-fg-subtle">Total Prescriptions</Text>
            <Heading level="h2">{data.prescriptions.total}</Heading>
            <div className="flex gap-2">
                <StatusBadge color="orange">Pending: {data.prescriptions.pending}</StatusBadge>
                <StatusBadge color="green">Approved: {data.prescriptions.approved}</StatusBadge>
            </div>
        </Container>

        <Container className="p-4 flex flex-col gap-y-2">
            <Text className="text-ui-fg-subtle">Sales (Last 7 Days)</Text>
            <Heading level="h2">₹{data.metrics.reduce((acc: number, m: any) => acc + Number(m.total_sales), 0).toLocaleString()}</Heading>
        </Container>

        <Container className="p-4 flex flex-col gap-y-2">
            <Text className="text-ui-fg-subtle">Avg. Daily Active Users</Text>
            <Heading level="h2">{Math.round(data.metrics.reduce((acc: number, m: any) => acc + m.active_users, 0) / data.metrics.length || 0)}</Heading>
        </Container>
      </div>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">Recent Sales Trend</Heading>
        <div className="h-48 w-full bg-ui-bg-subtle rounded-md flex items-end px-4 gap-2">
            {data.metrics.map((m: any, i: number) => (
                <div key={i} className="flex-1 bg-ui-bg-interactive rounded-t-sm" style={{ height: `${(m.total_sales / 10000) * 100}%`, minHeight: '4px' }}>
                    <div className="hidden group-hover:block absolute -top-8 bg-black text-white p-1 rounded text-xs">
                        ₹{m.total_sales}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-between mt-2 px-2 text-xs text-ui-fg-muted">
            {data.metrics.map((m: any, i: number) => (
                <span key={i}>{m.date.split("-").slice(1).join("/")}</span>
            ))}
        </div>
      </Container>
    </div>
  )
}

import { ChartPie } from "@medusajs/icons"

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartPie,
})

export default AnalyticsPage
