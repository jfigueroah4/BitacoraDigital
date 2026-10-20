'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import VistaMeses from '@/components/modules/VistaMeses';
import VistaDias from '@/components/modules/VistaDias';
import PdfViewerModal from '@/components/modals/PdfViewerModal';
import SubirDocumentoModal from '@/components/modals/SubirDocumentoModal';
import EditarDocumentoModal from '@/components/modals/EditarDocumentoModal';
import EliminarDocumentoModal from '@/components/modals/EliminarDocumentoModal';
import CargaMultipleDrawer from '@/components/modals/CargaMultipleDrawer';
import { DocumentoBitacora, MesInfo, UserProfile } from '@/types/bitacora';
import {
  DOCUMENTOS_INICIALES,
  DuracionProyecto,
  DURACION_PROYECTO_DEFAULT,
  generarMesesPorDuracion,
  MESES_NOMBRES,
} from '@/lib/mockData';
import { showSuccessToast } from '@/components/ui/Toast';
import {
  obtenerReportesBitacora,
  actualizarDocumentoBitacora,
  eliminarDocumentoBitacora,
} from '@/lib/supabase/storage';
import { registrarSesionDispositivo } from '@/lib/services/sesiones';

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoBitacora[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: number; anio: number } | null>(null);
  const [anioActual, setAnioActual] = useState<number | 'todos'>('todos');
  const [mesFiltro, setMesFiltro] = useState<number | 'todos'>('todos');

  // Duración del proyecto establecida por el usuario - lazy init para evitar reset al reiniciar/recargar
  const [duracionProyecto, setDuracionProyecto] = useState<DuracionProyecto>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('bitacora_duracion_proyecto');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            typeof parsed.mesInicio === 'number' &&
            typeof parsed.anioInicio === 'number' &&
            typeof parsed.mesFin === 'number' &&
            typeof parsed.anioFin === 'number'
          ) {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return DURACION_PROYECTO_DEFAULT;
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Modals state
  const [documentoParaVer, setDocumentoParaVer] = useState<DocumentoBitacora | null>(null);
  const [documentoParaEditar, setDocumentoParaEditar] = useState<DocumentoBitacora | null>(null);
  const [documentoParaEliminar, setDocumentoParaEliminar] = useState<DocumentoBitacora | null>(null);
  const [eliminandoDoc, setEliminandoDoc] = useState(false);
  const [modalSubirAbierto, setModalSubirAbierto] = useState(false);
  const [modalCargaMultipleAbierto, setModalCargaMultipleAbierto] = useState(false);
  const [diaSugeridoParaSubir, setDiaSugeridoParaSubir] = useState<number>(new Date().getDate());
  const [mesSugeridoParaSubir, setMesSugeridoParaSubir] = useState<number>(new Date().getMonth() + 1);
  const [anioSugeridoParaSubir, setAnioSugeridoParaSubir] = useState<number>(2026);

  // Auth check & load initial data & project duration
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bitacora_user_profile');
      if (!storedUser) {
        window.location.href = '/login';
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUserProfile(parsedUser);
      if (parsedUser && parsedUser.email) {
        try {
          registrarSesionDispositivo({ id: parsedUser.id, email: parsedUser.email });
        } catch (_) {}
      }

      // Sincronizar duración guardada en Supabase Storage (compartida para todos los dispositivos)
      const cargarDuracionCompartida = async () => {
        try {
          const res = await fetch('/api/config');
          const data = await res.json();
          if (data?.success && data?.duracion) {
            setDuracionProyecto(data.duracion);
            try {
              localStorage.setItem('bitacora_duracion_proyecto', JSON.stringify(data.duracion));
            } catch (_) {}
            return;
          }
        } catch (_) {}

        // Respaldo directo a la URL pública de Supabase Storage
        try {
          const resPublic = await fetch(
            `https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/public/Bitacora-documentos/config/duracion.json?t=${Date.now()}`
          );
          if (resPublic.ok) {
            const pubData = await resPublic.json();
            if (pubData && pubData.mesInicio) {
              setDuracionProyecto(pubData);
              try {
                localStorage.setItem('bitacora_duracion_proyecto', JSON.stringify(pubData));
              } catch (_) {}
            }
          }
        } catch (_) {}
      };

      cargarDuracionCompartida();

      // Cargar reportes reales desde Supabase DB (fuente de verdad definitiva)
      obtenerReportesBitacora().then((reportesBD) => {
        if (Array.isArray(reportesBD)) {
          setDocumentos(reportesBD);
          try {
            localStorage.setItem('bitacora_documentos_lista', JSON.stringify(reportesBD));
          } catch (_) {}
        }
      });
    } catch (e) {
      console.error(e);
      setDocumentos([]);
    }
  }, []);

  const esAdmin = userProfile?.rol === 'Administrador';

  // Guardar nueva duración del proyecto (Persistente en Supabase Storage, servidor, cookie y localStorage)
  const handleGuardarDuracion = (nueva: DuracionProyecto) => {
    setDuracionProyecto(nueva);
    try {
      localStorage.setItem('bitacora_duracion_proyecto', JSON.stringify(nueva));
      document.cookie = `bitacora_duracion_proyecto=${encodeURIComponent(
        JSON.stringify(nueva)
      )}; path=/; max-age=315360000; SameSite=Lax`;
    } catch (_) {}

    // 1. Guardar en API route (Cloudflare Edge con Supabase Admin)
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva),
    }).catch(() => {});

    // 2. Respaldo directo a Supabase Storage desde cliente
    try {
      const serviceKey =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Zm1wa3ByZW5lemN1dnNob21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjA5NTk2NSwiZXhwIjoyMTA3NjcxOTY1fQ.FSbkPuU06Yo6dkmBUsNdVdKgopQa9bzvW229cY0hPug';
      fetch(
        'https://nzfmpkprenezcuvshomd.supabase.co/storage/v1/object/Bitacora-documentos/config/duracion.json',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Content-Type': 'application/json',
            'x-upsert': 'true',
          },
          body: JSON.stringify(nueva),
        }
      ).catch(() => {});
    } catch (_) {}

    showSuccessToast(
      `Duración guardada para todos los usuarios: ${MESES_NOMBRES[nueva.mesInicio - 1]} ${nueva.anioInicio} a ${MESES_NOMBRES[nueva.mesFin - 1]} ${nueva.anioFin}`
    );
  };


  // Generate months based on project duration and documents
  const todosMeses = useMemo(() => {
    return generarMesesPorDuracion(
      duracionProyecto,
      documentos,
      anioActual === 'todos' ? null : anioActual
    );
  }, [duracionProyecto, documentos, anioActual]);

  // Filter months according to search query, month filter and date range
  const mesesFiltrados = useMemo(() => {
    return todosMeses.filter((m) => {
      // Month dropdown filter
      if (mesFiltro !== 'todos' && m.mes !== mesFiltro) {
        return false;
      }

      // Date range filter
      if (fechaInicio) {
        const dInicio = new Date(fechaInicio);
        const mesFinDate = new Date(m.anio, m.mes, 0);
        if (mesFinDate < dInicio) return false;
      }
      if (fechaFin) {
        const dFin = new Date(fechaFin);
        const mesInicioDate = new Date(m.anio, m.mes - 1, 1);
        if (mesInicioDate > dFin) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMes = m.nombre.toLowerCase().includes(q) || m.nombreMes.toLowerCase().includes(q);
        const matchDoc = m.documentos.some(
          (d) =>
            d.titulo.toLowerCase().includes(q) ||
            d.descripcion?.toLowerCase().includes(q) ||
            d.subidoPor.toLowerCase().includes(q) ||
            String(d.dia).includes(q)
        );
        return matchMes || matchDoc;
      }

      return true;
    });
  }, [todosMeses, mesFiltro, fechaInicio, fechaFin, searchQuery]);

  // Safe month info object that NEVER crashes or returns null when a month is selected
  const mesActivoObj = useMemo<MesInfo | null>(() => {
    if (!mesSeleccionado) return null;
    const { mes, anio } = mesSeleccionado;

    // 1. Try finding in current filtered list
    const match1 = todosMeses.find((m) => m.mes === mes && m.anio === anio);
    if (match1) return match1;

    // 2. Try finding across all months in duration
    const allMeses = generarMesesPorDuracion(duracionProyecto, documentos);
    const match2 = allMeses.find((m) => m.mes === mes && m.anio === anio);
    if (match2) return match2;

    // 3. Fallback object so the application never throws client-side exception
    const nombreMes = MESES_NOMBRES[mes - 1] || 'Mes';
    const docs = documentos.filter((d) => d.mes === mes && d.anio === anio);
    return {
      mes,
      anio,
      nombre: `${nombreMes} ${anio}`,
      nombreMes,
      totalDias: new Date(anio, mes, 0).getDate(),
      diasConDocumentos: new Set(docs.map((d) => d.dia)).size,
      documentos: docs,
    };
  }, [todosMeses, mesSeleccionado, duracionProyecto, documentos]);

  // Handler for uploading new document
  const handleDocumentoSubido = (nuevoDoc: DocumentoBitacora) => {
    setDocumentos((prev) => {
      // Replace if same date or append
      const filtrados = prev.filter(
        (d) => !(d.anio === nuevoDoc.anio && d.mes === nuevoDoc.mes && d.dia === nuevoDoc.dia)
      );
      const actualizados = [nuevoDoc, ...filtrados];
      try {
        localStorage.setItem('bitacora_documentos_lista', JSON.stringify(actualizados));
      } catch (_) {}
      return actualizados;
    });
  };

  // Handler for uploading multiple documents
  const handleDocumentosMultiplesSubidos = (nuevosDocs: DocumentoBitacora[]) => {
    setDocumentos((prev) => {
      const clavesNuevas = new Set(nuevosDocs.map((nd) => `${nd.anio}-${nd.mes}-${nd.dia}`));
      const noReemplazados = prev.filter((d) => !clavesNuevas.has(`${d.anio}-${d.mes}-${d.dia}`));
      const actualizados = [...nuevosDocs, ...noReemplazados];
      try {
        localStorage.setItem('bitacora_documentos_lista', JSON.stringify(actualizados));
      } catch (_) {}
      return actualizados;
    });
  };

  const handleSubirParaDia = (dia: number) => {
    setDiaSugeridoParaSubir(dia);
    if (mesActivoObj) {
      setMesSugeridoParaSubir(mesActivoObj.mes);
      setAnioSugeridoParaSubir(mesActivoObj.anio);
    } else if (mesSeleccionado) {
      setMesSugeridoParaSubir(mesSeleccionado.mes);
      setAnioSugeridoParaSubir(mesSeleccionado.anio);
    } else {
      const hoy = new Date();
      setMesSugeridoParaSubir(hoy.getMonth() + 1);
      setAnioSugeridoParaSubir(hoy.getFullYear());
    }
    setModalSubirAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!documentoParaEliminar) return;
    setEliminandoDoc(true);
    try {
      await eliminarDocumentoBitacora(documentoParaEliminar.id);
      setDocumentos((prev) => {
        const nuevo = prev.filter((d) => d.id !== documentoParaEliminar.id);
        try {
          localStorage.setItem('bitacora_documentos_lista', JSON.stringify(nuevo));
        } catch (_) {}
        return nuevo;
      });
      setDocumentoParaEliminar(null);
      showSuccessToast('Folio eliminado correctamente.');
    } finally {
      setEliminandoDoc(false);
    }
  };

  const handleGuardarEdicion = async (datos: {
    id: string;
    titulo: string;
    descripcion: string;
    dia: number;
    mes: number;
    anio: number;
    file?: File;
  }) => {
    const res = await actualizarDocumentoBitacora(datos.id, datos);
    if (res.success && res.nuevoDoc) {
      setDocumentos((prev) => {
        const nuevo = prev.map((doc) =>
          doc.id === datos.id ? ({ ...doc, ...res.nuevoDoc } as DocumentoBitacora) : doc
        );
        try {
          localStorage.setItem('bitacora_documentos_lista', JSON.stringify(nuevo));
        } catch (_) {}
        return nuevo;
      });
      showSuccessToast('Folio actualizado correctamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      {/* TopBar with brand, search bar, clickable book logo to return home */}
      <TopBar
        bitacoraNombre={
          mesActivoObj
            ? `Proyecto: Conexion VAS - Hincapie • ${mesActivoObj.nombre} ${mesActivoObj.anio}`
            : 'Proyecto: Conexion VAS - Hincapie'
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userProfile={userProfile}
        onVolverInicio={() => setMesSeleccionado(null)}
      />

      {/* Main Body Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6">
        {mesSeleccionado === null ? (
          /* VISTA 1: MESES */
          <VistaMeses
            meses={mesesFiltrados}
            anioActual={anioActual}
            onAnioChange={setAnioActual}
            mesFiltro={mesFiltro}
            onMesFiltroChange={setMesFiltro}
            onSeleccionarMes={(mesNum, anio) => {
              const anioFinal =
                anio ||
                (typeof anioActual === 'number' ? anioActual : duracionProyecto.anioInicio);
              setMesSeleccionado({ mes: mesNum, anio: anioFinal });
            }}
            esAdmin={esAdmin}
            onAbrirSubida={() => {
              const hoy = new Date();
              setDiaSugeridoParaSubir(hoy.getDate());
              setMesSugeridoParaSubir(hoy.getMonth() + 1);
              setAnioSugeridoParaSubir(hoy.getFullYear());
              setModalSubirAbierto(true);
            }}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
            onLimpiarFiltros={() => {
              setFechaInicio('');
              setFechaFin('');
              setMesFiltro('todos');
              setAnioActual('todos');
              setSearchQuery('');
            }}
            duracionProyecto={duracionProyecto}
            onGuardarDuracion={handleGuardarDuracion}
          />
        ) : (
          /* VISTA 2: DÍAS DEL MES SELECCIONADO */
          mesActivoObj && (
            <VistaDias
              mesInfo={mesActivoObj}
              todosLosMeses={generarMesesPorDuracion(duracionProyecto, documentos)}
              onVolverAMeses={() => setMesSeleccionado(null)}
              onCambiarMes={(nuevoMes, nuevoAnio) => {
                setMesSeleccionado({
                  mes: nuevoMes,
                  anio: nuevoAnio || mesActivoObj.anio,
                });
              }}
              onVerDocumento={(doc) => setDocumentoParaVer(doc)}
              onEditarDocumento={(doc) => setDocumentoParaEditar(doc)}
              onEliminarDocumento={(doc) => setDocumentoParaEliminar(doc)}
              esAdmin={esAdmin}
              onSubirParaDia={handleSubirParaDia}
              onAbrirCargaMultiple={() => setModalCargaMultipleAbierto(true)}
            />
          )
        )}
      </main>

      {/* VISTA 3: VISOR MODAL DE PDF EN TIEMPO REAL */}
      <PdfViewerModal
        documento={documentoParaVer}
        isOpen={Boolean(documentoParaVer)}
        onClose={() => setDocumentoParaVer(null)}
      />

      {/* MODAL DE EDICIÓN DE FOLIO */}
      <EditarDocumentoModal
        documento={documentoParaEditar}
        isOpen={Boolean(documentoParaEditar)}
        onClose={() => setDocumentoParaEditar(null)}
        onGuardar={handleGuardarEdicion}
        documentosExistentes={documentos}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <EliminarDocumentoModal
        documento={documentoParaEliminar}
        isOpen={Boolean(documentoParaEliminar)}
        onClose={() => setDocumentoParaEliminar(null)}
        onConfirm={handleConfirmarEliminar}
        eliminando={eliminandoDoc}
      />

      {/* DRAWER LATERAL DE SUBIDA INDIVIDUAL PARA ADMINISTRADOR */}
      <SubirDocumentoModal
        isOpen={modalSubirAbierto}
        onClose={() => setModalSubirAbierto(false)}
        diaSugerido={diaSugeridoParaSubir}
        mesSugerido={mesSugeridoParaSubir}
        anioSugerido={anioSugeridoParaSubir}
        usuarioNombre={userProfile?.nombre || 'Administrador'}
        onDocumentoSubido={handleDocumentoSubido}
        documentosExistentes={documentos}
        duracionProyecto={duracionProyecto}
      />

      {/* DRAWER LATERAL DE CARGA MÚLTIPLE DE ARCHIVOS Y FECHAS */}
      <CargaMultipleDrawer
        isOpen={modalCargaMultipleAbierto}
        onClose={() => setModalCargaMultipleAbierto(false)}
        mesActual={
          mesActivoObj?.mes ||
          (mesSeleccionado ? mesSeleccionado.mes : new Date().getMonth() + 1)
        }
        anioActual={
          mesActivoObj?.anio ||
          (mesSeleccionado ? mesSeleccionado.anio : new Date().getFullYear())
        }
        usuarioNombre={userProfile?.nombre || 'Administrador'}
        onDocumentosSubidos={handleDocumentosMultiplesSubidos}
        mesBloqueado={mesSeleccionado !== null}
        documentosExistentes={documentos}
      />
    </div>
  );
}
