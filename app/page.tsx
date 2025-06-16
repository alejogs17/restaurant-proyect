import { redirect } from "next/navigation"

export default async function Home() {
  // Redirigir directamente al dashboard sin verificar autenticación
  redirect("/dashboard")
}
