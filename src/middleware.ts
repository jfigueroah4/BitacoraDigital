import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas accesibles sin sesión
  const publicRoutes = [
    '/login',
    '/api',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/logo.ico',
    '/logoumg.png',
    '/white_logo.png',
    '/fondo_carretas.png',
    '/img.jpg',
    '/images',
  ];

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route) || pathname === route);
  const isStaticAsset =
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp');

  if (isPublic || isStaticAsset) {
    // Si ya tiene sesión activa y navega explícitamente a /login, redirigir al dashboard
    if (pathname === '/login') {
      const token = request.cookies.get('bitacora_token')?.value || request.cookies.get('token')?.value;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            const now = Math.floor(Date.now() / 1000);
            if (!payload.exp || payload.exp > now) {
              return NextResponse.redirect(new URL('/dashboard', request.url));
            }
          }
        } catch (_) {}
      }
    }
    return NextResponse.next();
  }

  // Comprobar token de sesión para rutas protegidas (/dashboard, /, etc.)
  const token = request.cookies.get('bitacora_token')?.value || request.cookies.get('token')?.value;

  if (!token) {
    // No hay sesión: siempre iniciar en /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar si el token expiró (contador de sesión)
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        // Expirado: eliminar cookies y redirigir a login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('bitacora_token');
        response.cookies.delete('token');
        return response;
      }
    }
  } catch (_) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('bitacora_token');
    response.cookies.delete('token');
    return response;
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
