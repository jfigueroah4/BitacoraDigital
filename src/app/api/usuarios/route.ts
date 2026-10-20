import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

const SUPABASE_USERS_CONFIG_URL =
  'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/usuarios.json';

const ROL_ADMIN_ID = '0d33ed9b-f68a-4c52-9e3c-8d72f8e99672';
const ROL_USUARIO_ID = '88546394-5d51-46cb-ab4a-d2f0de6a16d7';

export async function GET() {
  try {
    // 1. Prioridad: Supabase Storage compartido en Bitacora-documentos
    try {
      const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const corregidos = data.map((u: any) => {
            const isDFig = u.correo?.toLowerCase() === 'admin@bitacoradigital.com';
            const uname = isDFig ? 'DFIGUEROA' : (u.username || u.correo?.split('@')[0] || 'USUARIO');
            return {
              ...u,
              username: uname.toUpperCase(),
              password: u.password || 'VAS-HINCAPIE',
            };
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
          username: (p.username || p.correo?.split('@')[0] || 'USUARIO').toUpperCase(),
          nombre: p.nombre_completo || 'Usuario',
          correo: p.correo || '',
          rol: p.rol || 'Usuario',
          estado: p.estado || 'Activo',
          cargo: p.cargo_puesto || 'Colaborador',
          telefono: p.telefono || '',
          fechaCreacion: p.created_at ? p.created_at.slice(0, 10) : '2026-01-10',
          ultimoAcceso: 'Sin accesos todavía',
          contadorAccesos: 0,
          password: 'VAS-HINCAPIE',
        }));
        return NextResponse.json({ success: true, usuarios: mapeados });
      }
    }

    return NextResponse.json({ success: true, usuarios: [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, usuarios: [] }, { status: 500 });
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

    const pNom = (primer_nombre || '').trim();
    const sNom = (segundo_nombre || '').trim();
    const pApe = (primer_apellido || '').trim();
    const sApe = (segundo_apellido || '').trim();

    const nombreCompleto = `${pNom} ${sNom} ${pApe} ${sApe}`.replace(/\s+/g, ' ').trim();
    const finalEmail = (correo || '').trim().toLowerCase();
    const finalUsername = (username || `${pNom[0] || ''}${pApe || ''}`).replace(/[^A-Za-z0-9._]/g, '').toUpperCase();
    const finalRol = rol === 'Administrador' ? 'Administrador' : 'Usuario';
    const finalRolId = finalRol === 'Administrador' ? ROL_ADMIN_ID : ROL_USUARIO_ID;
    const finalPassword = password || 'VAS-HINCAPIE';

    let authUserId: string | null = null;

    if (supabaseAdmin && finalEmail) {
      // 1. Crear usuario en Supabase Auth con credenciales reales
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: finalPassword,
          email_confirm: true,
          user_metadata: {
            primer_nombre: pNom,
            primer_apellido: pApe,
            nombre_completo: nombreCompleto,
            username: finalUsername,
            rol: finalRol,
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

      const uid = authUserId || `usr-${Date.now()}`;

      // 2. Guardar en tabla usuario
      try {
        await supabaseAdmin.from('usuario').upsert({
          id: uid,
          correo: finalEmail,
          rol_id: finalRolId,
          activo: estado !== 'Suspendido',
          updated_at: new Date().toISOString(),
        });
      } catch (_) {}

      // 3. Guardar en perfil_usuario
      try {
        await supabaseAdmin.from('perfil_usuario').upsert({
          usuario_id: uid,
          nombre_completo: nombreCompleto,
          primer_nombre: pNom,
          segundo_nombre: sNom || null,
          primer_apellido: pApe,
          segundo_apellido: sApe || null,
          cargo_puesto: cargo || 'Colaborador',
          telefono: telefono || null,
          direccion: direccion || null,
          correo: finalEmail,
          empresa_institucion: 'VAI - ANCOPIE',
          estado: estado === 'Suspendido' ? 'Suspendido' : 'Activo',
        }, { onConflict: 'usuario_id' });
      } catch (_) {}
    }

    const nuevoUsuario = {
      id: authUserId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      primer_nombre: pNom,
      segundo_nombre: sNom || null,
      primer_apellido: pApe,
      segundo_apellido: sApe || null,
      username: finalUsername,
      nombre: nombreCompleto,
      correo: finalEmail,
      telefono: telefono || '',
      rol: finalRol,
      estado: estado === 'Suspendido' ? 'Suspendido' : 'Activo',
      cargo: cargo || 'Colaborador',
      direccion: direccion || null,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      ultimoAcceso: 'Sin accesos todavía',
      contadorAccesos: 0,
      password: finalPassword,
    };

    // 4. Sincronizar en Supabase Storage Bitacora-documentos/config/usuarios.json
    if (supabaseAdmin) {
      try {
        let listaActual: any[] = [];
        try {
          const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) listaActual = data;
          }
        } catch (_) {}

        const sinDup = listaActual.filter(
          (u) => u.correo?.toLowerCase() !== finalEmail && u.username?.toUpperCase() !== finalUsername
        );
        const nuevaLista = [nuevoUsuario, ...sinDup];

        const blob = new Blob([JSON.stringify(nuevaLista, null, 2)], { type: 'application/json' });
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
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

    if (!id && !correo) {
      return NextResponse.json({ success: false, error: 'ID o correo requerido para actualizar' }, { status: 400 });
    }

    const emailClean = (correo || '').trim().toLowerCase();
    const finalUsername = username ? username.trim().toUpperCase().replace(/[^A-Z0-9._]/g, '') : undefined;
    const finalRol = rol === 'Administrador' ? 'Administrador' : rol === 'Usuario' ? 'Usuario' : undefined;
    const finalRolId = finalRol === 'Administrador' ? ROL_ADMIN_ID : ROL_USUARIO_ID;

    // 1. Actualizar en Supabase Auth si se proporcionó contraseña o metadatos
    if (supabaseAdmin && id) {
      try {
        const updatePayload: any = {};
        if (password && password.trim()) updatePayload.password = password.trim();
        if (emailClean) updatePayload.email = emailClean;

        const metadata: any = {};
        if (primer_nombre) metadata.primer_nombre = primer_nombre;
        if (primer_apellido) metadata.primer_apellido = primer_apellido;
        if (finalUsername) metadata.username = finalUsername;
        if (finalRol) metadata.rol = finalRol;
        if (cargo) metadata.cargo = cargo;

        if (Object.keys(metadata).length > 0) updatePayload.user_metadata = metadata;

        if (Object.keys(updatePayload).length > 0 && id.length > 20) {
          await supabaseAdmin.auth.admin.updateUserById(id, updatePayload);
        }
      } catch (errAuth) {
        console.warn('[API /usuarios PUT] Error Auth update:', errAuth);
      }

      // 2. Actualizar en tablas usuario y perfil_usuario
      try {
        if (finalRolId || estado !== undefined) {
          await supabaseAdmin.from('usuario').update({
            ...(finalRolId ? { rol_id: finalRolId } : {}),
            ...(estado !== undefined ? { activo: estado !== 'Suspendido' } : {}),
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        }

        const perfilUpdate: any = { updated_at: new Date().toISOString() };
        if (primer_nombre !== undefined) perfilUpdate.primer_nombre = primer_nombre;
        if (segundo_nombre !== undefined) perfilUpdate.segundo_nombre = segundo_nombre;
        if (primer_apellido !== undefined) perfilUpdate.primer_apellido = primer_apellido;
        if (segundo_apellido !== undefined) perfilUpdate.segundo_apellido = segundo_apellido;
        if (cargo !== undefined) perfilUpdate.cargo_puesto = cargo;
        if (telefono !== undefined) perfilUpdate.telefono = telefono;
        if (direccion !== undefined) perfilUpdate.direccion = direccion;
        if (estado !== undefined) perfilUpdate.estado = estado;
        if (emailClean) perfilUpdate.correo = emailClean;

        await supabaseAdmin.from('perfil_usuario').update(perfilUpdate).or(`usuario_id.eq.${id},correo.eq.${emailClean}`);
      } catch (errDb) {
        console.warn('[API /usuarios PUT] Error DB update:', errDb);
      }
    }

    // 3. Sincronizar en Supabase Storage config/usuarios.json
    let usuarioActualizadoFinal: any = null;
    if (supabaseAdmin) {
      try {
        const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const actualizados = data.map((u: any) => {
              const coincide = (id && u.id === id) || (emailClean && u.correo?.toLowerCase() === emailClean);
              if (coincide) {
                const pN = primer_nombre !== undefined ? primer_nombre : u.primer_nombre;
                const pA = primer_apellido !== undefined ? primer_apellido : u.primer_apellido;
                const nomCompleto = body.nombre || `${pN || ''} ${pA || ''}`.trim() || u.nombre;

                usuarioActualizadoFinal = {
                  ...u,
                  primer_nombre: pN,
                  segundo_nombre: segundo_nombre !== undefined ? segundo_nombre : u.segundo_nombre,
                  primer_apellido: pA,
                  segundo_apellido: segundo_apellido !== undefined ? segundo_apellido : u.segundo_apellido,
                  username: finalUsername || u.username,
                  nombre: nomCompleto,
                  correo: emailClean || u.correo,
                  telefono: telefono !== undefined ? telefono : u.telefono,
                  cargo: cargo !== undefined ? cargo : u.cargo,
                  rol: finalRol || u.rol,
                  estado: estado !== undefined ? estado : u.estado,
                  direccion: direccion !== undefined ? direccion : u.direccion,
                  password: password ? password.trim() : (u.password || 'VAS-HINCAPIE'),
                };
                return usuarioActualizadoFinal;
              }
              return u;
            });

            const blob = new Blob([JSON.stringify(actualizados, null, 2)], { type: 'application/json' });
            await supabaseAdmin.storage
              .from('Bitacora-documentos')
              .upload('config/usuarios.json', blob, {
                upsert: true,
                cacheControl: '0',
                contentType: 'application/json',
              });
          }
        }
      } catch (errStorage) {
        console.warn('[API /usuarios PUT] Error storage sync:', errStorage);
      }
    }

    return NextResponse.json({ success: true, usuario: usuarioActualizadoFinal || body });
  } catch (err: any) {
    console.error('[API /usuarios PUT] Error general:', err);
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

      // 2. Borrar de perfil_usuario y usuario
      try {
        if (id) {
          await supabaseAdmin.from('perfil_usuario').delete().eq('usuario_id', id);
          await supabaseAdmin.from('usuario').delete().eq('id', id);
        }
        if (email) {
          await supabaseAdmin.from('perfil_usuario').delete().eq('correo', email);
          await supabaseAdmin.from('usuario').delete().eq('correo', email);
        }
      } catch (_) {}

      // 3. Borrar de config/usuarios.json en Storage
      try {
        const res = await fetch(`${SUPABASE_USERS_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const filtrados = data.filter((u) => u.id !== id && u.correo?.toLowerCase() !== email);
            const blob = new Blob([JSON.stringify(filtrados, null, 2)], { type: 'application/json' });
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
