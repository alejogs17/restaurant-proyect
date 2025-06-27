"use client"

import type React from "react"
import { Suspense } from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Label } from "@/Componentes/ui/label"
import { useToast } from "@/Componentes/ui/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/Componentes/ui/alert"
import { Session } from '@supabase/supabase-js'

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const searchParams = useSearchParams();
  const isInactive = searchParams.get("error") === "inactive_user";
  const [session, setSession] = useState<Session | null>(null)

  // Si el usuario está inactivo, cerrar sesión automáticamente
  useEffect(() => {
    if (isInactive) {
      supabase.auth.signOut();
    }
  }, [isInactive, supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
    })
  }, [supabase])

  // Solo redirigir al dashboard si NO es usuario inactivo
  if (session && process.env.NODE_ENV !== 'development' && !isInactive) {
    router.push("/dashboard")
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if we're in preview environment
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        toast({
          title: "Modo Preview",
          description: "Esta es una demostración. En producción se conectaría a Supabase.",
          variant: "default",
        })

        // Simulate successful login in preview
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw "Credenciales inválidas. Verifica tu email y contraseña."
      }

      if (data.session) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo al dashboard...",
        })

        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      console.error("Login error:", error)

      // Show different messages based on error type
      let errorMessage = "Por favor verifica tus credenciales e intenta de nuevo"

      if (error.message?.includes("fetch")) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet."
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Credenciales inválidas. Verifica tu email y contraseña."
      } else if (error.message?.includes("not configured")) {
        errorMessage = "Configuración de base de datos pendiente."
      }

      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-2">
      {isInactive && (
        <Alert variant="destructive">
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Su usuario está suspendido, no puede ingresar al sistema
          </AlertDescription>
        </Alert>
      )}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Iniciar Sesión</h2>
        <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Correo Electrónico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <Link
              href="/auth/reset-password"
              className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Iniciando sesión...
            </div>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">¿Necesitas ayuda? Contacta al administrador del sistema</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
