import { NextRequest, NextResponse } from 'next/server';
import { DURACION_PROYECTO_DEFAULT, DuracionProyecto } from '@/lib/mockData';

export const runtime = 'edge';

// Fallback en memoria en la instancia Edge
let duracionServidor: DuracionProyecto = DURACION_PROYECTO_DEFAULT;

export async function GET(req: NextRequest) {
  let actual = duracionServidor;

  // Si la cookie del cliente contiene una duración configurada, priorizarla
  const cookieVal = req.cookies.get('bitacora_duracion_proyecto')?.value;
  if (cookieVal) {
    try {
      const parsedCookie = JSON.parse(decodeURIComponent(cookieVal));
      if (
        parsedCookie &&
        typeof parsedCookie.mesInicio === 'number' &&
        typeof parsedCookie.anioInicio === 'number' &&
        typeof parsedCookie.mesFin === 'number' &&
        typeof parsedCookie.anioFin === 'number'
      ) {
        actual = parsedCookie;
        duracionServidor = actual;
      }
    } catch (_) {}
  }

  return NextResponse.json({
    success: true,
    duracion: actual,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (
      body &&
      typeof body.mesInicio === 'number' &&
      typeof body.anioInicio === 'number' &&
      typeof body.mesFin === 'number' &&
      typeof body.anioFin === 'number'
    ) {
      duracionServidor = {
        mesInicio: body.mesInicio,
        anioInicio: body.anioInicio,
        mesFin: body.mesFin,
        anioFin: body.anioFin,
      };

      const res = NextResponse.json({ success: true, duracion: duracionServidor });
      // Persistir en cookie a nivel de dominio por 5 años
      res.cookies.set('bitacora_duracion_proyecto', encodeURIComponent(JSON.stringify(duracionServidor)), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 5, // 5 años
        sameSite: 'lax',
      });
      return res;
    }
    return NextResponse.json({ success: false, error: 'Datos de duración inválidos' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
