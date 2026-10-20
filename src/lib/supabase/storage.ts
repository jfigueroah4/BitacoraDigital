import { supabase, isSupabaseConfigured } from './client';
import { DocumentoBitacora } from '@/types/bitacora';

export const BUCKET_BITACORA =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'Bitacora-documentos';

export function formatearBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface SubirDocumentoBitacoraParams {
  file: File;
  dia: number;
  mes: number;
  anio: number;
  titulo: string;
  descripcion?: string;
  subidoPor: string;
  subidoPorRol?: string;
}

export async function subirDocumentoBitacora({
  file,
  dia,
  mes,
  anio,
  titulo,
  descripcion = '',
  subidoPor,
  subidoPorRol = 'Administrador',
}: SubirDocumentoBitacoraParams): Promise<DocumentoBitacora> {
  const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  let docId = `bitacora-${anio}-${mes}-${dia}-${Date.now()}`;
  const tamanioFormateado = formatearBytes(file.size);
  let urlFinal = '';
  let storagePath = '';

  // 1. Subir al bucket de Supabase Storage
  if (isSupabaseConfigured() && supabase) {
    try {
      const sanitizedName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      storagePath = `${anio}/${String(mes).padStart(2, '0')}/${String(dia).padStart(2, '0')}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_BITACORA)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (error) {
        console.warn(`[Supabase Storage] Error subiendo al bucket ${BUCKET_BITACORA}:`, error.message);
        urlFinal = URL.createObjectURL(file);
      } else {
        const { data: pubData } = supabase.storage.from(BUCKET_BITACORA).getPublicUrl(data.path);
        urlFinal = pubData.publicUrl || URL.createObjectURL(file);
      }

      // 2. Guardar en tabla reportes_bitacora
      const { data: insertData, error: insertError } = await supabase
        .from('reportes_bitacora')
        .insert({
          fecha,
          dia,
          mes,
          anio,
          titulo,
          descripcion,
          nombre_archivo: file.name,
          url_storage: urlFinal,
          storage_path: storagePath || file.name,
          peso_bytes: file.size,
          peso_formateado: tamanioFormateado,
          nombre_responsable: subidoPor,
          estado: 'aprobado',
        })
        .select()
        .single();

      if (insertData && !insertError) {
        docId = insertData.id;
      } else if (insertError) {
        console.warn('[Supabase DB] Error guardando registro:', insertError.message);
      }
    } catch (storageErr) {
      console.warn('[Supabase Storage] Excepción:', storageErr);
      urlFinal = URL.createObjectURL(file);
    }
  } else {
    urlFinal = URL.createObjectURL(file);
  }

  const nuevoDoc: DocumentoBitacora = {
    id: docId,
    dia,
    mes,
    anio,
    fecha,
    titulo,
    descripcion,
    nombreArchivo: file.name,
    urlPdf: urlFinal,
    pesoBytes: file.size,
    pesoFormateado: tamanioFormateado,
    subidoPor,
    subidoPorRol,
    fechaSubida: new Date().toISOString(),
    estado: 'aprobado',
  };

  return nuevoDoc;
}

export async function obtenerReportesBitacora(): Promise<DocumentoBitacora[]> {
  // 1. Intentar vía API backend (Service Role, sin restricciones RLS)
  try {
    const res = await fetch(`/api/bitacora?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((item: any) => ({
          id: item.id,
          dia: item.dia,
          mes: item.mes,
          anio: item.anio,
          fecha: item.fecha,
          titulo: item.titulo,
          descripcion: item.descripcion || '',
          nombreArchivo: item.nombre_archivo,
          urlPdf: item.url_storage,
          pesoBytes: Number(item.peso_bytes || 0),
          pesoFormateado: item.peso_formateado || '100 KB',
          subidoPor: item.nombre_responsable || 'Administrador',
          subidoPorRol: 'Administrador',
          fechaSubida: item.created_at || new Date().toISOString(),
          estado: item.estado || 'aprobado',
        }));
      }
    }
  } catch (_) {}

  // 2. Respaldo directo en cliente Supabase
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('reportes_bitacora')
      .select('*')
      .order('fecha', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      dia: item.dia,
      mes: item.mes,
      anio: item.anio,
      fecha: item.fecha,
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      nombreArchivo: item.nombre_archivo,
      urlPdf: item.url_storage,
      pesoBytes: Number(item.peso_bytes || 0),
      pesoFormateado: item.peso_formateado || '100 KB',
      subidoPor: item.nombre_responsable || 'Administrador',
      subidoPorRol: 'Administrador',
      fechaSubida: item.created_at || new Date().toISOString(),
      estado: item.estado || 'aprobado',
    }));
  } catch (err) {
    console.warn('[Supabase DB] Error cargando reportes:', err);
    return [];
  }
}

export async function eliminarDocumentoBitacora(id: string): Promise<boolean> {
  let ok = false;

  // 1. Llamar al endpoint backend que cuenta con permisos Service Role para saltar RLS y borrar de storage
  try {
    const res = await fetch(`/api/bitacora?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      ok = true;
    }
  } catch (apiErr) {
    console.warn('[eliminarDocumentoBitacora] Error invocando API /api/bitacora:', apiErr);
  }

  // 2. Respaldo directo en cliente
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('reportes_bitacora').delete().eq('id', id);
    } catch (_) {}
  }

  return ok;
}

export async function actualizarDocumentoBitacora(
  id: string,
  datos: {
    titulo: string;
    descripcion?: string;
    dia: number;
    mes: number;
    anio: number;
    file?: File;
  }
): Promise<{ success: boolean; nuevoDoc?: Partial<DocumentoBitacora> }> {
  const fecha = `${datos.anio}-${String(datos.mes).padStart(2, '0')}-${String(datos.dia).padStart(2, '0')}`;
  let updatePayload: any = {
    titulo: datos.titulo,
    descripcion: datos.descripcion || '',
    dia: datos.dia,
    mes: datos.mes,
    anio: datos.anio,
    fecha,
  };

  if (datos.file && isSupabaseConfigured() && supabase) {
    try {
      const sanitizedName = `${Date.now()}_${datos.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `${datos.anio}/${String(datos.mes).padStart(2, '0')}/${String(datos.dia).padStart(2, '0')}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_BITACORA)
        .upload(storagePath, datos.file, {
          cacheControl: '3600',
          upsert: true,
          contentType: datos.file.type || 'application/pdf',
        });

      if (!error && data) {
        const { data: pubData } = supabase.storage.from(BUCKET_BITACORA).getPublicUrl(data.path);
        updatePayload.nombre_archivo = datos.file.name;
        updatePayload.url_storage = pubData.publicUrl;
        updatePayload.storage_path = storagePath;
        updatePayload.peso_bytes = datos.file.size;
        updatePayload.peso_formateado = formatearBytes(datos.file.size);
      }
    } catch (storageErr) {
      console.warn('[Supabase Storage] Excepción actualizando archivo:', storageErr);
    }
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('reportes_bitacora').update(updatePayload).eq('id', id);
    } catch (dbErr) {
      console.warn('[Supabase DB] Excepción actualizando BD:', dbErr);
    }
  }

  return {
    success: true,
    nuevoDoc: {
      titulo: updatePayload.titulo,
      descripcion: updatePayload.descripcion,
      dia: updatePayload.dia,
      mes: updatePayload.mes,
      anio: updatePayload.anio,
      fecha: updatePayload.fecha,
      ...(updatePayload.nombre_archivo ? {
        nombreArchivo: updatePayload.nombre_archivo,
        urlPdf: updatePayload.url_storage,
        pesoBytes: updatePayload.peso_bytes,
        pesoFormateado: updatePayload.peso_formateado,
      } : {}),
    },
  };
}

