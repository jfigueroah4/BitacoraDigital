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
import { DocumentoBitacora, MesInfo, UserProfile } from '@/types/bitacora';
import {
  DOCUMENTOS_INICIALES,
  DuracionProyecto,
  DURACION_PROYECTO_DEFAULT,
  generarMesesPorDuracion,
} from '@/lib/mockData';
import { showSuccessToast } from '@/components/ui/Toast';
import {
  obtenerReportesBitacora,
  actualizarDocumentoBitacora,
  eliminarDocumentoBitacora,
} from '@/lib/supabase/storage';

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoBitacora[]>([]);
  const [mesSeleccionadoNum, setMesSeleccionadoNum] = useState<number | null>(null);
  const [anioActual, setAnioActual] = useState<number | 'todos'>('todos');

  // Duración del proyecto establecida por el usuario
  const [duracionProyecto, setDuracionProyecto] = useState<DuracionProyecto>(DURACION_PROYECTO_DEFAULT);

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
  const [diaSugeridoParaSubir, setDiaSugeridoParaSubir] = useState<number>(new Date().getDate());
  const [mesSugeridoParaSubir, setMesSugeridoParaSubir] = useState<number>(new Date().getMonth() + 1);
  const [anioSugeridoParaSubir, setAnioSugeridoParaSubir] = useState<number>(2026);

  // Auth check & load initial data & project duration
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bitacora_user_profile');
      if (!storedUser) {
        const defaultProfile: UserProfile = {
          id: 'admin',
          nombre: 'Daniel Figueroa',
          email: 'admin@bitacoradigital.com',
          rol: 'Administrador',
          cargo: 'Administrador de Proyecto',
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('bitacora_user_profile', JSON.stringify(defaultProfile));
      } else {
        setUserProfile(JSON.parse(storedUser));
      }

      // Cargar duración del proyecto si existe guardada
      const storedDuracion = localStorage.getItem('bitacora_duracion_proyecto');
      if (storedDuracion) {
        try {
          const parsedDuracion = JSON.parse(storedDuracion);
          if (parsedDuracion?.mesInicio && parsedDuracion?.anioInicio) {
            setDuracionProyecto(parsedDuracion);
          }
        } catch (_) {}
      }

      // Limpiar datos quemados antiguos del caché si existieran
      try {
        const rawDocs = localStorage.getItem('bitacora_documentos_lista');
        if (rawDocs && rawDocs.includes('doc-2026-')) {
          localStorage.removeItem('bitacora_documentos_lista');
        }
      } catch (_) {}

      // Cargar reportes reales desde Supabase DB
      obtenerReportesBitacora().then((reportesBD) => {
        if (reportesBD && reportesBD.length > 0) {
          setDocumentos(reportesBD);
          localStorage.setItem('bitacora_documentos_lista', JSON.stringify(reportesBD));
        } else {
          const storedDocs = localStorage.getItem('bitacora_documentos_lista');
          if (storedDocs) {
            try {
              const parsed = JSON.parse(storedDocs);
              if (Array.isArray(parsed)) {
                const filtrados = parsed.filter((d: any) => !d.id?.startsWith('doc-2026-'));
                setDocumentos(filtrados);
                return;
              }
            } catch (_) {}
          }
          setDocumentos([]);
        }
      });
    } catch (e) {
      console.error(e);
      setDocumentos([]);
    }
  }, []);

  const esAdmin = userProfile?.rol === 'Administrador';

  // Guardar nueva duración del proyecto
  const handleGuardarDuracion = (nueva: DuracionProyecto) => {
    setDuracionProyecto(nueva);
    try {
      localStorage.setItem('bitacora_duracion_proyecto', JSON.stringify(nueva));
    } catch (_) {}
    showSuccessToast(
      `Duración actualizada: ahora se muestran todos los meses desde inicio hasta fin de obra.`
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

  // Filter months according to search query and date range
  const mesesFiltrados = useMemo(() => {
    return todosMeses.filter((m) => {
      // Date filter
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
  }, [todosMeses, fechaInicio, fechaFin, searchQuery]);

  const mesActivoObj = useMemo(() => {
    if (mesSeleccionadoNum === null) return null;
    return (
      todosMeses.find((m) => m.mes === mesSeleccionadoNum) ||
      generarMesesPorDuracion(duracionProyecto, documentos).find((m) => m.mes === mesSeleccionadoNum) ||
      null
    );
  }, [todosMeses, mesSeleccionadoNum, duracionProyecto, documentos]);

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

  const handleSubirParaDia = (dia: number) => {
    setDiaSugeridoParaSubir(dia);
    if (mesSeleccionadoNum) {
      setMesSugeridoParaSubir(mesSeleccionadoNum);
    }
    if (mesActivoObj) {
      setAnioSugeridoParaSubir(mesActivoObj.anio);
    } else if (typeof anioActual === 'number') {
      setAnioSugeridoParaSubir(anioActual);
    } else {
      setAnioSugeridoParaSubir(duracionProyecto.anioInicio);
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
        bitacoraNombre="BITÁCORA VAI - ANCOPIE"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userProfile={userProfile}
        onVolverInicio={() => setMesSeleccionadoNum(null)}
      />

      {/* Main Body Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6">
        {mesSeleccionadoNum === null ? (
          /* VISTA 1: MESES */
          <VistaMeses
            meses={mesesFiltrados}
            anioActual={anioActual}
            onAnioChange={setAnioActual}
            onSeleccionarMes={(mesNum, anio) => {
              setMesSeleccionadoNum(mesNum);
              if (anio && typeof anioActual === 'number' && anioActual !== anio) {
                setAnioActual(anio);
              }
            }}
            esAdmin={esAdmin}
            onAbrirSubida={() => {
              setDiaSugeridoParaSubir(new Date().getDate());
              setMesSugeridoParaSubir(new Date().getMonth() + 1);
              setAnioSugeridoParaSubir(
                typeof anioActual === 'number' ? anioActual : duracionProyecto.anioInicio
              );
              setModalSubirAbierto(true);
            }}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onFechaInicioChange={setFechaInicio}
            onFechaFinChange={setFechaFin}
            onLimpiarFiltros={() => {
              setFechaInicio('');
              setFechaFin('');
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
              onVolverAMeses={() => setMesSeleccionadoNum(null)}
              onCambiarMes={(nuevoMes, nuevoAnio) => {
                setMesSeleccionadoNum(nuevoMes);
                if (nuevoAnio && typeof anioActual === 'number') {
                  setAnioActual(nuevoAnio);
                }
              }}
              onVerDocumento={(doc) => setDocumentoParaVer(doc)}
              onEditarDocumento={(doc) => setDocumentoParaEditar(doc)}
              onEliminarDocumento={(doc) => setDocumentoParaEliminar(doc)}
              esAdmin={esAdmin}
              onSubirParaDia={handleSubirParaDia}
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

      {/* DRAWER LATERAL DE SUBIDA PARA ADMINISTRADOR */}
      <SubirDocumentoModal
        isOpen={modalSubirAbierto}
        onClose={() => setModalSubirAbierto(false)}
        diaSugerido={diaSugeridoParaSubir}
        mesSugerido={mesSugeridoParaSubir}
        anioSugerido={anioSugeridoParaSubir}
        usuarioNombre={userProfile?.nombre || 'Administrador'}
        onDocumentoSubido={handleDocumentoSubido}
        documentosExistentes={documentos}
      />
    </div>
  );
}
