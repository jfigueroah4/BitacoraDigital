import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const SUPABASE_USERS_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/usuarios.json';

const USUARIO_DFIGUEROA = {
  id: '1f36ea33-admin-dfigueroa',
  primer_nombre: 'Daniel',
  primer_apellido: 'Figueroa',
  username: 'DFIGUEROA',
  nombre: 'Daniel Figueroa',
  correo: 'admin@bitacoradigital.com',
  rol: 'Administrador',
  estado: 'Activo',
  cargo: 'Administrador de Proyecto',
  telefono: '+502 56252922',
  fechaCreacion: '2026-01-10',
  direccion: 'Ciudad de Guatemala',
  ultimoAcceso: 'Sin accesos todavía',
  contadorAccesos: 1,
};

export async function GET() {
  try {
    // 1. Prioridad: Supabase Storage compartido en Bitacora-documentos
    try {
      const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Garantizar que dfigueroa siempre tenga username dfigueroa
          const corregidos = data.map((u: any) => {
            const isDFig = u.correo?.toLowerCase() === 'admin@bitacoradigital.com';
            const uname = isDFig ? 'DFIGUEROA' : (u.username || u.correo?.split('@')[0] || 'USUARIO');
            return { ...u, username: uname.toUpperCase() };
          });
          return NextResponse.json({ success: true, usuarios: corregidos });
        }
      }
    } catch (_) {}

    // 2. Respaldo: perfil_usuario en base de datos
    if (supabaseAdmin) {
      const { data: dbPerfiles, error } = await supabaseAdmin
        .from('perfil_usuario')
        .select('*');

      if (!error && dbPerfiles && dbPerfiles.length > 0) {
        const mapeados = dbPerfiles.map((p: any) => ({
          id: p.usuario_id || p.id,
          primer_nombre: p.primer_nombre || 'Usuario',
          primer_apellido: p.primer_apellido || '',
          username: p.correo?.toLowerCase() === 'admin@bitacoradigital.com' ? 'DFIGUEROA' : (p.username || p.correo?.split('@')[0] || 'usuario'),
          nombre: p.nombre_completo || 'Usuario',
          correo: p.correo || '',
          rol: p.rol || 'Usuario',
          estado: 'Activo',
          cargo: p.cargo_puesto || 'Colaborador',
          telefono: p.telefono || '',
          fechaCreacion: p.created_at ? p.created_at.slice(0, 10) : '2026-01-10',
          ultimoAcceso: 'Sin accesos todavía',
          contadorAccesos: 0,
        }));
        return NextResponse.json({ success: true, usuarios: mapeados });
      }
    }

    return NextResponse.json({ success: true, usuarios: [USUARIO_DFIGUEROA] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, usuarios: [USUARIO_DFIGUEROA] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      username,
      correo,
      telefono,
      cargo,
      rol,
      estado,
      direccion,
      password,
    } = body;

    const nombreCompleto = `${primer_nombre || ''} ${segundo_nombre || ''} ${primer_apellido || ''} ${segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    const finalEmail = (correo || '').trim().toLowerCase();
    const finalUsername = (username || `${primer_nombre?.[0] || ''}${primer_apellido || ''}`).replace(/[^A-Za-z0-9._]/g, '').toUpperCase();

    let authUserId: string | null = null;

    if (supabaseAdmin && finalEmail) {
      // 1. Crear usuario en Supabase Auth con credenciales reales
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: password || 'VAS-HINCAPIE',
          email_confirm: true,
          user_metadata: {
            primer_nombre,
            primer_apellido,
            nombre_completo: nombreCompleto,
            username: finalUsername,
            rol: rol || 'Usuario',
            cargo: cargo || 'Colaborador',
          },
        });

        if (!authError && authData?.user) {
          authUserId = authData.user.id;
        } else if (authError) {
          console.warn('[API /usuarios POST] Auth createUser:', authError.message);
        }
      } catch (authErr: any) {
        console.warn('[API /usuarios POST] Auth exception:', authErr.message);
      }

      // 2. Guardar en perfil_usuario
      try {
        await supabaseAdmin.from('perfil_usuario').upsert({
          usuario_id: authUserId || `usr-${Date.now()}`,
          nombre_completo: nombreCompleto,
          primer_nombre,
          primer_apellido,
          cargo_puesto: cargo || 'Colaborador',
          telefono: telefono || null,
          direccion: direccion || null,
        });
      } catch (_) {}
    }

    const nuevoUsuario = {
      id: authUserId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      primer_nombre,
      segundo_nombre: segundo_nombre || null,
      primer_apellido,
      segundo_apellido: segundo_apellido || null,
      username: finalUsername,
      nombre: nombreCompleto,
      correo: finalEmail,
      telefono: telefono || '',
      rol: rol || 'Usuario',
      estado: estado === 'Suspendido' ? 'Suspendido' : 'Activo',
      cargo: cargo || 'Colaborador',
      direccion: direccion || null,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      ultimoAcceso: 'Sin accesos todavía',
      contadorAccesos: 0,
      password: password || 'VAS-HINCAPIE',
    };

    // 3. Sincronizar en Supabase Storage Bitacora-documentos/config/usuarios.json
    if (supabaseAdmin) {
      try {
        // Cargar lista existente
        let listaActual: any[] = [USUARIO_DFIGUEROA];
        try {
          const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) listaActual = data;
          }
        } catch (_) {}

        // Filtrar duplicados y anteponer el nuevo
        const sinDup = listaActual.filter(
          (u) => u.correo?.toLowerCase() !== finalEmail && u.username?.toLowerCase() !== finalUsername.toLowerCase()
        );
        const nuevaLista = [nuevoUsuario, ...sinDup];

        const blob = new Blob([JSON.stringify(nuevaLista)], { type: 'application/json' });
        await supabaseAdmin.storage
          .from('Bitacora-documentos')
          .upload('config/usuarios.json', blob, {
            upsert: true,
            cacheControl: '0',
            contentType: 'application/json',
          });
      } catch (storageErr) {
        console.warn('[API /usuarios POST] Error storage sync:', storageErr);
      }
    }

    return NextResponse.json({ success: true, usuario: nuevoUsuario });
  } catch (err: any) {
    console.error('[API /usuarios POST] Error general:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email')?.toLowerCase();

    if (!id && !email) {
      return NextResponse.json({ success: false, error: 'ID o correo requerido' }, { status: 400 });
    }

    if (email === 'admin@bitacoradigital.com' || id === '1f36ea33-admin-dfigueroa') {
      return NextResponse.json({ success: false, error: 'El administrador principal no puede ser eliminado' }, { status: 403 });
    }

    if (supabaseAdmin) {
      // 1. Borrar de Auth si es UUID válido
      if (id && id.length > 20) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(id);
        } catch (_) {}
      }

      // 2. Borrar de perfil_usuario
      try {
        if (id) await supabaseAdmin.from('perfil_usuario').delete().eq('usuario_id', id);
        if (email) await supabaseAdmin.from('perfil_usuario').delete().eq('correo', email);
      } catch (_) {}

      // 3. Borrar de config/usuarios.json en Storage
      try {
        const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const filtrados = data.filter((u) => u.id !== id && u.correo?.toLowerCase() !== email);
            const blob = new Blob([JSON.stringify(filtrados)], { type: 'application/json' });
            await supabaseAdmin.storage
              .from('Bitacora-documentos')
              .upload('config/usuarios.json', blob, {
                upsert: true,
                cacheControl: '0',
                contentType: 'application/json',
              });
          }
        }
      } catch (_) {}
    }

    return NextResponse.json({ success: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
