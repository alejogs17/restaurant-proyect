"use client"

import { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/Componentes/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Componentes/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Componentes/ui/table"
import { CreateUserDialog } from "@/Componentes/Usuarios/create-user-dialog"
import { EditUserDialog } from "@/Componentes/Usuarios/edit-user-dialog"
import { UserStatsCards } from "@/Componentes/Usuarios/user-stats-cards"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/Componentes/ui/use-toast"
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { User, Profile } from "@/app/types"

interface AuthUser extends SupabaseUser {
  user_metadata: {
    status?: string
  }
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    console.log('Checking session...')
    setIsSessionLoading(true)
    // Check for an active session when the component mounts
    supabase.auth.getSession().then(({ data: { session: currentSession } }: { data: { session: Session | null } }) => {
      console.log('Session status:', currentSession ? 'Active' : 'No session')
      setSession(currentSession)
      setIsSessionLoading(false)
      if (currentSession) {
        fetchUsers()
      } else {
        setIsLoading(false)
        // Don't show error toast here as middleware should handle redirect
        console.log('No active session, middleware should redirect')
      }
    }).catch((error: Error) => {
      console.error('Error checking session:', error)
      setIsSessionLoading(false)
      setIsLoading(false)
      // Don't show error toast here as middleware should handle redirect
      console.log('Session check error, middleware should redirect')
    })

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession ? 'Active' : 'No session')
      setSession(newSession)
      if (newSession) {
        fetchUsers()
      } else {
        // Session ended, clear users and stop loading
        setUsers([])
        setIsLoading(false)
        console.log('Session ended, clearing data')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log('=== FETCH USERS START ===')
      setIsLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check:', session ? 'Session exists' : 'No session')
      
      if (!session) {
        console.log('No session available for fetching users')
        setIsLoading(false)
        return
      }

      console.log('Current user ID:', session.user.id)
      console.log('Current user email:', session.user.email)

      // Try to get users with emails via API route first
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const { users } = await response.json()
          console.log('Users fetched via API:', users)
          setUsers(users)
          setIsLoading(false)
          return
        } else {
          console.log('API route failed, falling back to direct query')
        }
      } catch (apiError) {
        console.log('API route error, falling back to direct query:', apiError)
      }

      // Fallback: Fetch all profiles from the 'profiles' table
      console.log('Fetching profiles from database...')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Profiles query result:', { profiles, error: profilesError })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message)
        console.error('Error details:', profilesError)
        toast({
          title: "Error",
          description: "No se pudieron cargar los perfiles: " + profilesError.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found in the database.')
        setUsers([])
        setIsLoading(false)
        return
      }

      console.log('Profiles fetched successfully:', profiles.length)
      console.log('First profile sample:', profiles[0])

      const formattedUsers: User[] = profiles.map((profile: Profile): User => {
        // Check if this is the current user to get their email
        const isCurrentUser = profile.id === session.user.id
        const email = isCurrentUser ? session.user.email || 'No disponible' : 'No disponible'
        
        return {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: email,
          role: profile.role,
          status: profile.status,
          phone: profile.phone,
          last_sign_in_at: undefined,
          created_at: profile.created_at,
          avatar_url: profile.avatar_url,
          total_orders: profile.total_orders,
          total_sales: profile.total_sales,
        }
      })

      console.log('Formatted users:', formattedUsers)
      console.log('Current user role from profiles:', profiles.find((p: Profile) => p.id === session.user.id)?.role)
      setUsers(formattedUsers)
      console.log('=== FETCH USERS END ===')
      
    } catch (error) {
      console.error('An unexpected error occurred in fetchUsers:', error)
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error al cargar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserStatusToggle = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`,
      })

      // Refresh the users list
      fetchUsers()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      })
    }
  }

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
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Add loading state display
  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-lg">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!session && process.env.NODE_ENV !== 'development') { // Allow mock data in dev
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">Por favor, inicie sesión para acceder a esta página</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Usuarios ({users.length})</h1>
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8"
              />
            </div>
            <select
              className="p-2 border rounded-md"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="waiter">Meseros</option>
              <option value="cashier">Cajeros</option>
              <option value="chef">Chefs</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                          {getInitials(user.first_name, user.last_name)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email || 'Sin email'}</p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>{getRoleText(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>{getStatusText(user.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Nunca"}
                    </TableCell>
                    <TableCell>
                      {user.total_orders ? (
                        <div>
                          <p>{user.total_orders} órdenes</p>
                          <p className="text-sm text-green-600">{formatCurrency(user.total_sales || 0)}</p>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              await handleUserStatusToggle(user)
                            }}
                          >
                            {user.status === 'active' ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onUserCreated={fetchUsers}
      />

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onUserEdited={fetchUsers}
      />
    </div>
  )
}
