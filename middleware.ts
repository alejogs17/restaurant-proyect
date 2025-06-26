import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Verificar si las variables de entorno están configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not configured in middleware")
    // Si no están configuradas, permitir el acceso sin autenticación
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // Si no hay sesión y se intenta acceder a una ruta protegida
    if (!session && pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Si hay sesión
    if (session) {
      // Redirigir desde la raíz o auth al dashboard
      if (pathname.startsWith("/auth") || pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Verificar status para cualquier ruta bajo /dashboard
      if (pathname.startsWith("/dashboard")) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching user profile or profile not found", profileError);
          return NextResponse.redirect(new URL("/dashboard?error=profile_not_found", request.url));
        }

        const userRole = profile.role;
        const userStatus = profile.status;

        if (userStatus !== 'active') {
          const redirectUrl = new URL("/auth/login", request.url);
          redirectUrl.searchParams.set("error", "inactive_user");
          return NextResponse.redirect(redirectUrl);
        }

        // Comprobar roles para rutas protegidas
        const routeRoles = Object.entries(protectedRoutes).find(([route]) => pathname.startsWith(route));
        if (routeRoles) {
          const allowedRoles = routeRoles[1];
          if (!allowedRoles.includes(userRole)) {
            return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in middleware:", error)
    // En caso de error, redirigir al login
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
