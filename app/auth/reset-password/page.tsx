"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        throw error
      }

      setSent(true)
      toast({
        title: "Enlace enviado",
        description: "Revisa tu correo para el enlace de recuperación",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el enlace de recuperación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    // Ajustar el espaciado para mejor centrado vertical
    <div className="space-y-6 py-2">
      {sent ? (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Revisa tu correo</h2>
            <p className="text-muted-foreground">Hemos enviado un enlace de recuperación a</p>
            <p className="font-medium text-orange-600">{email}</p>
          </div>

          <div className="space-y-3">
            <Button
              asChild
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Link>
            </Button>

            <Button variant="outline" className="w-full h-11" onClick={() => setSent(false)}>
              Enviar a otro correo
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Recuperar Contraseña</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
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

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </Button>

              <Button asChild variant="outline" className="w-full h-11">
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Link>
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
