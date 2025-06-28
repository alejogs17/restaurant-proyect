"use client"

import { Badge } from "@/Componentes/ui/badge"

import { useState } from "react"
import { Save, Bell, Shield, Database, Printer, Globe } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Input } from "@/Componentes/ui/input"
import { Label } from "@/Componentes/ui/label"
import { Switch } from "@/Componentes/ui/switch"
import { Textarea } from "@/Componentes/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { useToast } from "@/Componentes/ui/use-toast"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Estados para diferentes configuraciones
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: "RestauranteOS",
    address: "Calle 26 #68-35, Bogotá, Colombia",
    phone: "+57 601 234 5678",
    email: "info@restauranteos.com",
    website: "www.restauranteos.com",
    description: "Sistema de gestión integral para restaurantes",
    timezone: "America/Bogota",
    currency: "COP",
    language: "es",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
    paymentAlerts: true,
    systemUpdates: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "120",
    passwordExpiry: "90",
    loginAttempts: "5",
    ipWhitelist: "",
  })

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    maintenanceMode: false,
    debugMode: false,
    logLevel: "info",
    maxFileSize: "10",
  })

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true)
    try {
      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Configuración Guardada",
        description: `Las configuraciones de ${section} han sido actualizadas correctamente`,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
          <p className="text-gray-600">Administra las configuraciones del sistema</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        {/* Configuraciones Generales */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuraciones Generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                  <Input
                    id="restaurantName"
                    value={generalSettings.restaurantName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, restaurantName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={generalSettings.phone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={generalSettings.website}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={generalSettings.description}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("General")} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuraciones"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones de Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuraciones de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Recibir alertas críticas por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones en tiempo real en el navegador
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Stock Bajo</Label>
                    <p className="text-sm text-muted-foreground">Notificar cuando los productos estén por agotarse</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, lowStockAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Nuevas Órdenes</Label>
                    <p className="text-sm text-muted-foreground">Notificar cuando se reciban nuevos pedidos</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newOrderAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, newOrderAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Pagos</Label>
                    <p className="text-sm text-muted-foreground">Notificar sobre transacciones y pagos</p>
                  </div>
                  <Switch
                    checked={notificationSettings.paymentAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, paymentAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actualizaciones del Sistema</Label>
                    <p className="text-sm text-muted-foreground">Notificar sobre actualizaciones y mantenimiento</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, systemUpdates: checked })
                    }
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("Notificaciones")} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuraciones"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones de Seguridad */}
        <TabsContent value="security">
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
                  placeholder="192.168.1.1&#10;10.0.0.1&#10;..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Una IP por línea. Dejar vacío para permitir todas las IPs.
                </p>
              </div>

              <Button onClick={() => handleSaveSettings("Seguridad")} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuraciones"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones del Sistema */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuraciones del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respaldo Automático</Label>
                  <p className="text-sm text-muted-foreground">Crear respaldos automáticos de la base de datos</p>
                </div>
                <Switch
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                <Select
                  value={systemSettings.backupFrequency}
                  onValueChange={(value) => setSystemSettings({ ...systemSettings, backupFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Cada hora</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">Activar para realizar mantenimiento del sistema</p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Depuración</Label>
                  <p className="text-sm text-muted-foreground">Mostrar información detallada para desarrolladores</p>
                </div>
                <Switch
                  checked={systemSettings.debugMode}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logLevel">Nivel de Logs</Label>
                  <Select
                    value={systemSettings.logLevel}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, logLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Solo Errores</SelectItem>
                      <SelectItem value="warn">Advertencias</SelectItem>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="debug">Depuración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
                  <Select
                    value={systemSettings.maxFileSize}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, maxFileSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 MB</SelectItem>
                      <SelectItem value="10">10 MB</SelectItem>
                      <SelectItem value="25">25 MB</SelectItem>
                      <SelectItem value="50">50 MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("Sistema")} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuraciones"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones de Integraciones */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Integraciones y APIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Supabase Database</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Conectado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Base de datos principal del sistema</p>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Impresora de Cocina</h3>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pendiente
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Impresión automática de órdenes en cocina</p>
                  <Button variant="outline" size="sm">
                    Conectar
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Pasarela de Pagos</h3>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Desconectado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Procesamiento de pagos con tarjeta</p>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Sistema de Delivery</h3>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      No configurado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Integración con plataformas de delivery</p>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Notificaciones WhatsApp</h3>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      No configurado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Envío de notificaciones por WhatsApp</p>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("Integraciones")} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuraciones"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
