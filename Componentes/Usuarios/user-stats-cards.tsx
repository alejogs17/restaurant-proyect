"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Users, UserCheck, UserX, Shield } from "lucide-react"
import type { User } from "@/app/types"

interface UserStatsCardsProps {
  users: User[]
}

export function UserStatsCards({ users }: UserStatsCardsProps) {
  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.status === "active").length
  const inactiveUsers = users.filter((user) => user.status === "inactive").length
  const adminUsers = users.filter((user) => user.role === "admin").length

  const stats = [
    {
      title: "Total Usuarios",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Usuarios Activos",
      value: activeUsers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Usuarios Inactivos",
      value: inactiveUsers,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Administradores",
      value: adminUsers,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.title === "Usuarios Activos" && `${((activeUsers / totalUsers) * 100).toFixed(1)}% del total`}
              {stat.title === "Total Usuarios" && "Registrados en el sistema"}
              {stat.title === "Usuarios Inactivos" && `${((inactiveUsers / totalUsers) * 100).toFixed(1)}% del total`}
              {stat.title === "Administradores" && "Con permisos completos"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
