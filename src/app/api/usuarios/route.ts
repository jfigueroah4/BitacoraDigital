import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ success: true, usuarios: [] });
    }

    const { data, error } = await admin
      .from('perfil_usuario')
      .select('*, usuario(*, rol(*))');

    if (error) {
      console.warn('[API /usuarios GET] Error en consulta perfil_usuario:', error.message);
      return NextResponse.json({ success: false, error: error.message, usuarios: [] });
    }

    return NextResponse.json({ success: true, usuarios: data || [] });
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

    const nombreCompleto = `${primer_nombre || ''} ${segundo_nombre || ''} ${primer_apellido || ''} ${segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    const admin = getAdminClient();

    let authUserId: string | null = null;

    if (admin && correo) {
      // 1. Intentar crear usuario en Supabase Auth
      try {
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
          email: correo,
          password: password || 'Bitacora2026*',
          email_confirm: true,
          user_metadata: {
            primer_nombre,
            primer_apellido,
            nombre_completo: nombreCompleto,
            username: username || correo.split('@')[0],
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
        console.warn('[API /usuarios POST] Auth error:', authErr.message);
      }

      // 2. Intentar guardar en perfil_usuario si la tabla existe
      if (authUserId) {
        try {
          await admin.from('perfil_usuario').upsert({
            usuario_id: authUserId,
            nombre_completo: nombreCompleto,
            primer_nombre: primer_nombre,
            primer_apellido: primer_apellido,
            cargo_puesto: cargo || 'Colaborador',
            telefono: telefono || null,
            direccion: direccion || null,
          });
        } catch (dbErr: any) {
          console.warn('[API /usuarios POST] DB upsert perfil_usuario:', dbErr.message);
        }
      }
    }

    const nuevoUsuario = {
      id: authUserId || `user-${Date.now()}`,
      primer_nombre,
      segundo_nombre: segundo_nombre || null,
      primer_apellido,
      segundo_apellido: segundo_apellido || null,
      username: (username || `${primer_nombre?.[0] || ''}${primer_apellido || ''}`).toUpperCase().replace(/[^A-Z0-9]/g, ''),
      nombre: nombreCompleto,
      correo,
      telefono: telefono || '',
      rol: rol || 'Usuario',
      estado: estado || 'Activo',
      cargo: cargo || 'Colaborador',
      direccion: direccion || null,
      fechaCreacion: new Date().toISOString().slice(0, 10),
    };

    return NextResponse.json({ success: true, usuario: nuevoUsuario });
  } catch (err: any) {
    console.error('[API /usuarios POST] Error general:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
