import { redirect } from "next/navigation"

export default async function Home() {
  // Redirigir al login como estaba originalmente
  redirect("/auth/login")
}
