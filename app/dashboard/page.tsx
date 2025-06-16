import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { TableStatus } from "@/components/dashboard/table-status"
import { TopSellingItems } from "@/components/dashboard/top-selling-items"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del restaurante</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Status */}
        <TableStatus />

        {/* Recent Orders */}
        <RecentOrders />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <TopSellingItems />
      </div>
    </div>
  )
}
