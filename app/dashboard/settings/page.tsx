import ProtectedRoute from "@/Componentes/ProtectedRoute"
import { useState } from "react"
import { Save, Shield } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Label } from "@/Componentes/ui/label"
import { Switch } from "@/Componentes/ui/switch"
import { Textarea } from "@/Componentes/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { useToast } from "@/Componentes/ui/use-toast"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "120",
    passwordExpiry: "90",
    loginAttempts: "5",
    ipWhitelist: "",
  })

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Configuración Guardada",
        description: `Las configuraciones de Seguridad han sido actualizadas correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seguridad</h1>
            <p className="text-gray-600">Administra las configuraciones de seguridad del sistema</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuraciones de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-muted-foreground">
                  Agregar una capa extra de seguridad al inicio de sesión
                </p>
              </div>
              <Switch
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Expiración de Contraseña (días)</Label>
                <Select
                  value={securitySettings.passwordExpiry}
                  onValueChange={(value) => setSecuritySettings({ ...securitySettings, passwordExpiry: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loginAttempts">Intentos de Login Máximos</Label>
                <Select
                  value={securitySettings.loginAttempts}
                  onValueChange={(value) => setSecuritySettings({ ...securitySettings, loginAttempts: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 intentos</SelectItem>
                    <SelectItem value="5">5 intentos</SelectItem>
                    <SelectItem value="10">10 intentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">Lista Blanca de IPs (opcional)</Label>
              <Textarea
                id="ipWhitelist"
                value={securitySettings.ipWhitelist}
                onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                placeholder="192.168.1.1\n10.0.0.1\n..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Una IP por línea. Dejar vacío para permitir todas las IPs.
              </p>
            </div>

            <Button onClick={handleSaveSettings} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : "Guardar Configuraciones"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 