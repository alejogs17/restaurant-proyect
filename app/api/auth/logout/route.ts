import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Cerrar sesión en el servidor
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Error al cerrar sesión:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in logout API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 