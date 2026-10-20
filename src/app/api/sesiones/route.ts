import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const SUPABASE_SESIONES_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/sesiones.json';

const SUPABASE_USERS_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/usuarios.json';

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
    const ahoraIso = new Date().toISOString();
    const ahoraFormateado = new Date().toLocaleString('es-GT', {
      timeZone: 'America/Guatemala',
      dateStyle: 'short',
      timeStyle: 'short',
    });

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
      ip: ip || 'Red Local / Internet',
      ultimoAcceso: ahoraIso,
      fechaInicio: ahoraIso,
      activo: true,
    };

    sesiones.unshift(nuevaSesion);

    // 1. Guardar sesiones en Storage
    if (supabaseAdmin) {
      const blob = new Blob([JSON.stringify(sesiones, null, 2)], { type: 'application/json' });
      await supabaseAdmin.storage
        .from('Bitacora-documentos')
        .upload('config/sesiones.json', blob, {
          upsert: true,
          cacheControl: '0',
          contentType: 'application/json',
        });

      // 2. Actualizar ultimoAcceso y contadorAccesos en config/usuarios.json
      try {
        const uRes = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (uRes.ok) {
          const uList = await uRes.json();
          if (Array.isArray(uList)) {
            const actualizados = uList.map((u: any) => {
              if (u.correo?.toLowerCase() === correoClean) {
                return {
                  ...u,
                  ultimoAcceso: ahoraFormateado,
                  contadorAccesos: (u.contadorAccesos || 0) + 1,
                };
              }
              return u;
            });

            const uBlob = new Blob([JSON.stringify(actualizados, null, 2)], { type: 'application/json' });
            await supabaseAdmin.storage
              .from('Bitacora-documentos')
              .upload('config/usuarios.json', uBlob, {
                upsert: true,
                cacheControl: '0',
                contentType: 'application/json',
              });
          }
        }
      } catch (errUsers) {
        console.warn('[POST /api/sesiones] Error actualizando usuarios.json:', errUsers);
      }

      // 3. Actualizar ultimo_acceso en BD relacional
      try {
        await supabaseAdmin
          .from('usuario')
          .update({ ultimo_acceso: ahoraIso, updated_at: ahoraIso })
          .eq('correo', correoClean);
      } catch (_) {}
    }

    return NextResponse.json({ success: true, sesion: nuevaSesion, sesiones, ultimoAcceso: ahoraFormateado });
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
      const blob = new Blob([JSON.stringify(sesiones, null, 2)], { type: 'application/json' });
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
