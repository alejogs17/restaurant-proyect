import { DashboardStats } from "@/Componentes/Panel/dashboard-stats"
import { RecentOrders } from "@/Componentes/Panel/recent-orders"
import { TableStatus } from "@/Componentes/Panel/table-status"
import { TopSellingItems } from "@/Componentes/Panel/top-selling-items"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
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
