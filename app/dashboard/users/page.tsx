"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { EditUserDialog } from "@/components/users/edit-user-dialog"
import { UserStatsCards } from "@/components/users/user-stats-cards"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  // Datos de ejemplo para usuarios
  const users = [
    {
      id: 1,
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@restaurante.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15T10:30:00",
      createdAt: "2023-06-15T09:00:00",
      avatar: null,
      phone: "+57 300 123 4567",
      totalOrders: 0,
      totalSales: 0,
    },
    {
      id: 2,
      firstName: "Carlos",
      lastName: "Rodríguez",
      email: "carlos.rodriguez@restaurante.com",
      role: "waiter",
      status: "active",
      lastLogin: "2024-01-15T14:20:00",
      createdAt: "2023-08-20T10:30:00",
      avatar: null,
      phone: "+57 310 987 6543",
      totalOrders: 156,
      totalSales: 8450000,
    },
    {
      id: 3,
      firstName: "Ana",
      lastName: "Martínez",
      email: "ana.martinez@restaurante.com",
      role: "cashier",
      status: "active",
      lastLogin: "2024-01-15T16:45:00",
      createdAt: "2023-09-10T11:15:00",
      avatar: null,
      phone: "+57 320 555 1234",
      totalOrders: 89,
      totalSales: 4230000,
    },
    {
      id: 4,
      firstName: "Luis",
      lastName: "Hernández",
      email: "luis.hernandez@restaurante.com",
      role: "chef",
      status: "active",
      lastLogin: "2024-01-15T08:15:00",
      createdAt: "2023-07-05T08:00:00",
      avatar: null,
      phone: "+57 315 444 7890",
      totalOrders: 0,
      totalSales: 0,
    },
    {
      id: 5,
      firstName: "Patricia",
      lastName: "Silva",
      email: "patricia.silva@restaurante.com",
      role: "waiter",
      status: "inactive",
      lastLogin: "2024-01-10T12:00:00",
      createdAt: "2023-11-20T14:30:00",
      avatar: null,
      phone: "+57 325 666 3210",
      totalOrders: 45,
      totalSales: 2180000,
    },
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "waiter":
        return "bg-blue-100 text-blue-800"
      case "cashier":
        return "bg-green-100 text-green-800"
      case "chef":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "waiter":
        return "Mesero"
      case "cashier":
        return "Cajero"
      case "chef":
        return "Chef"
      default:
        return role
    }
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusText = (status: string) => {
    return status === "active" ? "Activo" : "Inactivo"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === "all" || user.role === selectedRole

    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <UserStatsCards users={users} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="waiter">Mesero</option>
              <option value="cashier">Cajero</option>
              <option value="chef">Chef</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Rendimiento</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {getRoleText(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(user.status)}>
                      {getStatusText(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDateTime(user.lastLogin)}</div>
                  </TableCell>
                  <TableCell>
                    {user.role === "waiter" ? (
                      <div className="text-sm">
                        <div>{user.totalOrders} órdenes</div>
                        <div className="text-green-600 font-medium">{formatCurrency(user.totalSales)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {user.status === "active" ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </div>
  )
}
