import { NextRequest, NextResponse } from 'next/server';

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    }
  } catch (_) {}
  return null;
}

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
    return NextResponse.next();
  }

  // Raíz del proyecto siempre inicia en login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Comprobar token de sesión para rutas protegidas (/dashboard, etc.)
  const token = request.cookies.get('bitacora_token')?.value || request.cookies.get('token')?.value;

  if (!token) {
    // No hay sesión: redirigir a login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar si el token expiró (contador de sesión)
  const payload = parseJwt(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('bitacora_token');
    response.cookies.delete('token');
    return response;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    // Expirado: eliminar cookies y redirigir a login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('bitacora_token');
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
