import { NextRequest, NextResponse } from 'next/server';
import { DURACION_PROYECTO_DEFAULT, DuracionProyecto } from '@/lib/mockData';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const SUPABASE_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/duracion.json';

// Fallback en memoria en la instancia Edge
let duracionServidor: DuracionProyecto = DURACION_PROYECTO_DEFAULT;

export async function GET(req: NextRequest) {
  let actual = duracionServidor;

  // 1. Prioridad: Supabase Storage compartido para todos los usuarios y dispositivos
  try {
    const resSupabase = await fetch(`${SUPABASE_CONFIG_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (resSupabase.ok) {
      const data = await resSupabase.json();
      if (
        data &&
        typeof data.mesInicio === 'number' &&
        typeof data.anioInicio === 'number' &&
        typeof data.mesFin === 'number' &&
        typeof data.anioFin === 'number'
      ) {
        duracionServidor = data;
        return NextResponse.json({
          success: true,
          duracion: data,
        });
      }
    }
  } catch (_) {}

  // 2. Si falló la red a Supabase, intentar cookie del cliente
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
      const nuevaDuracion: DuracionProyecto = {
        mesInicio: body.mesInicio,
        anioInicio: body.anioInicio,
        mesFin: body.mesFin,
        anioFin: body.anioFin,
      };

      duracionServidor = nuevaDuracion;

      // 1. Guardar en Supabase Storage para que se refleje inmediatamente en todos los clientes
      try {
        const serviceKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Zm1wa3ByZW5lemN1dnNob21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjA5NTk2NSwiZXhwIjoyMTA3NjcxOTY1fQ.FSbkPuU06Yo6dkmBUsNdVdKgopQa9bzvW229cY0hPug';
        await fetch(
          'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/Bitacora-documentos/config/duracion.json',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey,
              'Content-Type': 'application/json',
              'x-upsert': 'true',
            },
            body: JSON.stringify(nuevaDuracion),
          }
        );
      } catch (storageErr) {
        console.warn('[API Config POST] Error guardando en Supabase Storage:', storageErr);
      }

      const res = NextResponse.json({ success: true, duracion: nuevaDuracion });
      // Persistir en cookie a nivel de dominio por 5 años
      res.cookies.set('bitacora_duracion_proyecto', encodeURIComponent(JSON.stringify(nuevaDuracion)), {
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

