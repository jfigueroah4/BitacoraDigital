import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const SUPABASE_SESIONES_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/sesiones.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const correo = searchParams.get('correo')?.trim().toLowerCase();

    const res = await fetch(`${SUPABASE_SESIONES_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
    let sesiones: any[] = [];
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) sesiones = data;
    }

    if (correo) {
      sesiones = sesiones.filter((s) => (s.usuarioCorreo || '').toLowerCase() === correo);
    }

    return NextResponse.json({ success: true, sesiones });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, sesiones: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, usuarioCorreo, dispositivo, ip, usuarioNombre } = body;

    if (!id || !usuarioCorreo) {
      return NextResponse.json({ success: false, error: 'id y usuarioCorreo son requeridos' }, { status: 400 });
    }

    const correoClean = usuarioCorreo.trim().toLowerCase();

    let sesiones: any[] = [];
    try {
      const res = await fetch(`${SUPABASE_SESIONES_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) sesiones = data;
      }
    } catch (_) {}

    // Remover sesión anterior de este mismo dispositivo si existía
    sesiones = sesiones.filter((s) => s.id !== id);

    const nuevaSesion = {
      id,
      usuarioCorreo: correoClean,
      usuarioNombre: usuarioNombre || 'Usuario',
      dispositivo: dispositivo || 'Navegador Web',
      ip: ip || 'Local',
      ultimoAcceso: new Date().toISOString(),
      fechaInicio: new Date().toISOString(),
      activo: true,
    };

    sesiones.unshift(nuevaSesion);

    if (supabaseAdmin) {
      const blob = new Blob([JSON.stringify(sesiones)], { type: 'application/json' });
      await supabaseAdmin.storage
        .from('Bitacora-documentos')
        .upload('config/sesiones.json', blob, {
          upsert: true,
          cacheControl: '0',
          contentType: 'application/json',
        });
    }

    return NextResponse.json({ success: true, sesion: nuevaSesion, sesiones });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const correo = searchParams.get('correo')?.trim().toLowerCase();

    if (!id && !correo) {
      return NextResponse.json({ success: false, error: 'id o correo es requerido' }, { status: 400 });
    }

    let sesiones: any[] = [];
    try {
      const res = await fetch(`${SUPABASE_SESIONES_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) sesiones = data;
      }
    } catch (_) {}

    if (id) {
      sesiones = sesiones.filter((s) => s.id !== id);
    } else if (correo) {
      sesiones = sesiones.filter((s) => (s.usuarioCorreo || '').toLowerCase() !== correo);
    }

    if (supabaseAdmin) {
      const blob = new Blob([JSON.stringify(sesiones)], { type: 'application/json' });
      await supabaseAdmin.storage
        .from('Bitacora-documentos')
        .upload('config/sesiones.json', blob, {
          upsert: true,
          cacheControl: '0',
          contentType: 'application/json',
        });
    }

    return NextResponse.json({ success: true, mensaje: 'Sesión terminada exitosamente', sesiones });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
