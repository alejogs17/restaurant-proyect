import ProtectedRoute from "@/Componentes/ProtectedRoute"
import UsuariosPage from "../Usuarios/page"

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <UsuariosPage />
    </ProtectedRoute>
  )
} 