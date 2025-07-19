"use client"

import React, { useState, ChangeEvent, FormEvent } from "react"
import { Button } from "@/Componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Componentes/ui/dialog"
import { Input } from "@/Componentes/ui/input"
import { Label } from "@/Componentes/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/app/types"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const [lastSignupAttempt, setLastSignupAttempt] = useState<Date | null>(null)
  const SIGNUP_COOLDOWN = 48000 // 48 seconds in milliseconds
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Check for rate limiting
      if (lastSignupAttempt) {
        const timeSinceLastAttempt = Date.now() - lastSignupAttempt.getTime()
        if (timeSinceLastAttempt < SIGNUP_COOLDOWN) {
          const remainingTime = Math.ceil((SIGNUP_COOLDOWN - timeSinceLastAttempt) / 1000)
          throw new Error(`Por favor espera ${remainingTime} segundos antes de intentar crear otro usuario`)
        }
      }

      // Validaciones
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
        throw new Error("Todos los campos obligatorios deben ser completados")
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }

      if (formData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      // Update last signup attempt timestamp
      setLastSignupAttempt(new Date())

      // 1. Crear la cuenta de autenticación
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
          }
        }
      })

      if (authError) {
        console.error('Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        })
        if (authError.message.includes('48 seconds')) {
          throw new Error("Por favor espera 48 segundos antes de intentar crear otro usuario")
        }
        if (authError.message.includes('email')) {
          throw new Error("El correo electrónico ya está registrado o no es válido")
        }
        throw new Error(authError.message || "Error al crear la cuenta de usuario")
      }

      if (!authData?.user?.id) {
        throw new Error("No se pudo crear la cuenta de usuario")
      }

      // 2. Actualizar el perfil del usuario (ya fue creado por trigger)
const { error: profileError } = await supabase
.from('profiles')
.update({
  first_name: formData.firstName,
  last_name: formData.lastName,
  phone: formData.phone || null,
  role: formData.role,
  status: 'active'
})
.eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile creation error:', profileError)
        
        // Si falla la creación del perfil, no intentamos borrar el usuario
        // ya que no tenemos acceso a admin.deleteUser desde el cliente
        throw new Error("Error al crear el perfil del usuario: " + profileError.message)
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      })

      onUserCreated?.()
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError(error instanceof Error ? error.message : "Error al crear el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo usuario. Todos los campos son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@restaurante.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="waiter">Mesero</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repetir contraseña"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
