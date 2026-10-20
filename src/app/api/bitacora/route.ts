import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin no configurado', data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('reportes_bitacora')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, titulo, descripcion, dia, mes, anio, url_storage, storage_path, nombre_archivo, peso_bytes, peso_formateado } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de documento requerido' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin no configurado' }, { status: 500 });
    }

    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const updatePayload: any = {
      titulo,
      descripcion: descripcion || '',
      dia,
      mes,
      anio,
      fecha,
      updated_at: new Date().toISOString(),
    };

    if (url_storage) updatePayload.url_storage = url_storage;
    if (storage_path) updatePayload.storage_path = storage_path;
    if (nombre_archivo) updatePayload.nombre_archivo = nombre_archivo;
    if (peso_bytes !== undefined) updatePayload.peso_bytes = peso_bytes;
    if (peso_formateado) updatePayload.peso_formateado = peso_formateado;

    const { data, error } = await supabaseAdmin
      .from('reportes_bitacora')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de documento requerido' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin no configurado' }, { status: 500 });
    }

    // 1. Obtener registro antes de borrar para obtener storage_path
    const { data: docData } = await supabaseAdmin
      .from('reportes_bitacora')
      .select('storage_path')
      .eq('id', id)
      .single();

    // 2. Eliminar de la base de datos con privilegios admin (ignora RLS)
    const { error: dbError } = await supabaseAdmin
      .from('reportes_bitacora')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.warn('[API /bitacora DELETE] Error en base de datos:', dbError.message);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    // 3. Si tiene storage_path, eliminar del bucket Bitacora-documentos
    if (docData?.storage_path) {
      try {
        await supabaseAdmin.storage
          .from('Bitacora-documentos')
          .remove([docData.storage_path]);
      } catch (storageErr) {
        console.warn('[API /bitacora DELETE] Error eliminando archivo storage:', storageErr);
      }
    }

    return NextResponse.json({ success: true, mensaje: 'Documento eliminado exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
