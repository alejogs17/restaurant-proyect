// import { createServerClient } from "@supabase/ssr"
// import { NextResponse, type NextRequest } from "next/server"

// Definición de rutas y roles permitidos
const protectedRoutes = {
  "/dashboard/tables": ["admin", "cashier", "chef", "waiter"],
  "/dashboard/orders": ["admin", "cashier", "chef", "waiter"],
  "/dashboard/Facturacion": ["admin", "cashier"],
  "/dashboard/menu": ["admin", "chef", "waiter", "cashier"],
  "/dashboard/kitchen": ["admin", "chef", "waiter", "cashier"],
  "/dashboard/inventory": ["admin", "chef", "cashier"],
  "/dashboard/purchases": ["admin", "cashier"],
  "/dashboard/reports": ["admin"],
  "/dashboard/users": ["admin"],
  "/dashboard/settings": ["admin"],
};

// export async function middleware(request: NextRequest) {
//   ...
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
// }
