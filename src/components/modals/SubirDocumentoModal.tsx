'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Calendar,
  Info,
  Clock,
} from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES, getDiasEnMes, DuracionProyecto } from '@/lib/mockData';
import { subirDocumentoBitacora, formatearBytes } from '@/lib/supabase/storage';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { Portal } from '@/components/ui/Portal';

interface SubirDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaSugerido?: number;
  mesSugerido?: number;
  anioSugerido?: number;
  usuarioNombre: string;
  onDocumentoSubido: (doc: DocumentoBitacora) => void;
  documentosExistentes?: DocumentoBitacora[];
  duracionProyecto?: DuracionProyecto;
}

export default function SubirDocumentoModal({
  isOpen,
  onClose,
  diaSugerido,
  mesSugerido,
  anioSugerido,
  usuarioNombre,
  onDocumentoSubido,
  documentosExistentes = [],
  duracionProyecto,
}: SubirDocumentoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hoyInicial = new Date();
  const [dia, setDia] = useState<number>(() => Number(diaSugerido) || hoyInicial.getDate());
  const [mes, setMes] = useState<number>(() => Number(mesSugerido) || hoyInicial.getMonth() + 1);
  const [anio, setAnio] = useState<number>(() => Number(anioSugerido) || hoyInicial.getFullYear());
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Documentos válidos existentes
  const docsValidos = useMemo(() => {
    if (!Array.isArray(documentosExistentes)) return [];
    return documentosExistentes.filter((d) => Boolean(d && typeof d === 'object'));
  }, [documentosExistentes]);

  // Documentos que ya existen en el mes y año seleccionados
  const docsEnMes = useMemo(() => {
    return docsValidos.filter(
      (d) => Number(d.mes) === Number(mes) && Number(d.anio) === Number(anio)
    );
  }, [docsValidos, mes, anio]);

  const docExistenteEnDia = useMemo(() => {
    return docsEnMes.find((d) => Number(d.dia) === Number(dia)) || null;
  }, [docsEnMes, dia]);

  // Validar si la fecha está dentro de la duración establecida del proyecto
  const fueraDeDuracion = useMemo(() => {
    if (!duracionProyecto) return false;
    const aInicio = Number(duracionProyecto.anioInicio);
    const mInicio = Number(duracionProyecto.mesInicio);
    const aFin = Number(duracionProyecto.anioFin);
    const mFin = Number(duracionProyecto.mesFin);

    if (isNaN(aInicio) || isNaN(mInicio) || isNaN(aFin) || isNaN(mFin)) return false;

    if (anio < aInicio || (anio === aInicio && mes < mInicio)) return true;
    if (anio > aFin || (anio === aFin && mes > mFin)) return true;
    return false;
  }, [duracionProyecto, mes, anio]);

  // Sincronizar fecha sugerida (por defecto la fecha de hoy) al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      setDia(Number(diaSugerido) || hoy.getDate());
      setMes(Number(mesSugerido) || hoy.getMonth() + 1);
      setAnio(Number(anioSugerido) || hoy.getFullYear());
      setArchivo(null);
      setTitulo('');
      setDescripcion('');
      setMostrarConfirmacion(false);
    }
  }, [isOpen, diaSugerido, mesSugerido, anioSugerido]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !subiendo) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, subiendo, onClose]);

  if (!isOpen) return null;

  const diasEnMesActual = Math.max(1, getDiasEnMes(mes || 1, anio || 2026) || 31);

  // Años disponibles basados en el proyecto
  const aniosDisponibles = (() => {
    const fallback = [
      2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
      2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
      2040, 2041, 2042, 2043, 2044, 2045
    ];
    if (!duracionProyecto) return fallback;
    const aIni = Number(duracionProyecto.anioInicio);
    const aFin = Number(duracionProyecto.anioFin);
    if (isNaN(aIni) || isNaN(aFin)) return fallback;

    const min = Math.min(aIni, 2026);
    const max = Math.max(aFin, 2046);
    const lista: number[] = [];
    for (let y = min; y <= max; y++) {
      lista.push(y);
    }
    return lista.length > 0 ? lista : fallback;
  })();

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showErrorToast('Por favor selecciona un documento en formato PDF.');
      return;
    }
    setArchivo(file);
    if (!titulo) {
      const nombreLimpio = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitulo(`Folio Día ${dia} - ${nombreLimpio}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleValidarAntesDeConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      showErrorToast('Debes adjuntar el documento PDF de la bitácora.');
      return;
    }
    if (!titulo.trim()) {
      showErrorToast('Ingresa un título o folio para el registro.');
      return;
    }
    setMostrarConfirmacion(true);
  };

  const handleConfirmarSubida = async () => {
    if (!archivo) return;
    setSubiendo(true);

    try {
      const nuevoDoc = await subirDocumentoBitacora({
        file: archivo,
        dia,
        mes,
        anio,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        subidoPor: usuarioNombre || 'Administrador',
        subidoPorRol: 'Administrador',
      });

      onDocumentoSubido(nuevoDoc);
      showSuccessToast(
        docExistenteEnDia
          ? `¡Folio del día ${dia} de ${MESES_NOMBRES[mes - 1] || 'mes'} actualizado exitosamente!`
          : `¡Bitácora del día ${dia} de ${MESES_NOMBRES[mes - 1] || 'mes'} subida exitosamente!`
      );
      // Limpiar y cerrar
      setArchivo(null);
      setTitulo('');
      setDescripcion('');
      setMostrarConfirmacion(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Error al subir el documento');
    } finally {
      setSubiendo(false);
    }
  };

  const esPesoOptimo = Boolean(archivo && archivo.size <= 500 * 1024);
  const esPesoAceptable = Boolean(archivo && archivo.size <= 2 * 1024 * 1024);

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px] transition-opacity animate-fadeIn"
        onClick={() => {
          if (!subiendo) onClose();
        }}
      />

      {/* Drawer Lateral */}
      <div className="fixed inset-y-0 right-0 z-[10000] w-full max-w-md bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
        {/* Header del Drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B2219]/10 flex items-center justify-center text-[#3B2219]">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Subir Documento de Bitácora
              </h3>
              <p className="text-[10px] text-gray-500">
                Almacenamiento seguro en la nube &bull; Formato PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={subiendo}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content del Drawer con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!mostrarConfirmacion ? (
            <form id="drawer-subir-form" onSubmit={handleValidarAntesDeConfirmar} className="space-y-4">
              {/* 1. SELECCIÓN DE FECHA EN ORDEN: DÍA, MES, AÑO */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <Calendar size={13} className="text-[#3B2219]" />
                  <span>Fecha de registro (Día, Mes, Año) <span className="text-red-500">*</span></span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {/* 1. DÍA */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">
                      Día
                    </label>
                    <select
                      value={dia}
                      onChange={(e) => setDia(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                    >
                      {Array.from({ length: diasEnMesActual }, (_, i) => i + 1).map((d) => {
                        const tieneDoc = docsEnMes.some((doc) => doc && Number(doc.dia) === d);
                        return (
                          <option key={d} value={d}>
                            {d} {tieneDoc ? '(Con folio)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 2. MES */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">
                      Mes
                    </label>
                    <select
                      value={mes}
                      onChange={(e) => {
                        const nuevoMes = Number(e.target.value);
                        setMes(nuevoMes);
                        const maxDias = getDiasEnMes(nuevoMes, anio);
                        if (dia > maxDias) setDia(maxDias);
                      }}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                    >
                      {MESES_NOMBRES.map((nombre, idx) => (
                        <option key={idx} value={idx + 1}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. AÑO */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">
                      Año
                    </label>
                    <select
                      value={anio}
                      onChange={(e) => {
                        const nuevoAnio = Number(e.target.value);
                        setAnio(nuevoAnio);
                        const maxDias = getDiasEnMes(mes, nuevoAnio);
                        if (dia > maxDias) setDia(maxDias);
                      }}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                    >
                      {aniosDisponibles.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ALERTA: Si la fecha está fuera del periodo del proyecto */}
                {fueraDeDuracion && duracionProyecto && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-900 text-xs">
                    <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Fecha fuera del periodo del proyecto</p>
                      <p className="text-[10.5px] text-amber-700 mt-0.5">
                        El proyecto está establecido desde <strong>{MESES_NOMBRES[(duracionProyecto.mesInicio || 1) - 1]} {duracionProyecto.anioInicio}</strong> hasta <strong>{MESES_NOMBRES[(duracionProyecto.mesFin || 12) - 1]} {duracionProyecto.anioFin}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* ALERTA: Si la fecha seleccionada ya cuenta con un folio registrado */}
                {docExistenteEnDia && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-blue-900 text-xs">
                    <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ya existe un folio en esta fecha</p>
                      <p className="text-[10.5px] text-blue-700 mt-0.5">
                        El <strong>Día {dia} de {MESES_NOMBRES[(mes || 1) - 1]} {anio}</strong> ya tiene el folio: <em>"{docExistenteEnDia.titulo || 'Folio'}"</em>. Al subir este nuevo archivo, <strong>se actualizará el registro existente</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. TÍTULO DEL FOLIO */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Título del Registro / Folio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Folio 045 - Avance Terracería Estación 14+250"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] focus:bg-white transition-colors"
                />
              </div>

              {/* 3. OBSERVACIONES TÉCNICAS */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Observaciones Técnicas (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas de campo, compactación, ensayos o eventos relevantes..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] focus:bg-white resize-none transition-colors"
                />
              </div>

              {/* 4. DROPZONE DE ARCHIVO PDF */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Documento PDF de Bitácora <span className="text-red-500">*</span>
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#3B2219] bg-[#F4ECE6]/40 scale-[1.01]'
                      : archivo
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-gray-200 hover:border-[#3B2219] bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {archivo ? (
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
                        <FileText size={20} />
                      </div>
                      <span className="text-xs font-bold text-gray-800 truncate max-w-[260px]">
                        {archivo.name}
                      </span>
                      <span className="text-[10.5px] font-medium text-gray-500 mt-0.5">
                        Peso: {formatearBytes(archivo.size)}
                      </span>

                      {esPesoOptimo ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle size={10} /> Peso ligero óptimo
                        </span>
                      ) : esPesoAceptable ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle size={10} /> Peso moderado (&le; 2 MB)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle size={10} /> Archivo pesado
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud size={26} className="text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-800">
                        Haz clic para seleccionar o arrastra tu archivo PDF
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Peso sugerido: ~100 KB para visualización ultra rápida
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
            /* Confirmación dentro del Drawer */
            <div className="space-y-4 py-2 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-[#F4ECE6] text-[#3B2219] flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>

              <div className="text-center">
                <h4 className="text-sm font-bold text-gray-900">
                  {docExistenteEnDia ? '¿Confirmar actualización de folio?' : '¿Confirmar publicación de bitácora?'}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  {docExistenteEnDia
                    ? `Se actualizará el folio existente para el Día ${dia} de ${MESES_NOMBRES[(mes || 1) - 1]} ${anio}.`
                    : 'El documento se guardará de inmediato y estará disponible en el calendario de obra.'}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha asignada:</span>
                  <span className="font-bold text-gray-800">
                    Día {dia} de {MESES_NOMBRES[(mes || 1) - 1]} de {anio}
                  </span>
                </div>
                {docExistenteEnDia && (
                  <div className="flex justify-between text-blue-700">
                    <span className="text-gray-500">Estado:</span>
                    <span className="font-bold">Reemplazo / Actualización</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Título / Folio:</span>
                  <span className="font-bold text-gray-800 truncate max-w-[200px]">
                    {titulo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Archivo:</span>
                  <span className="font-bold text-gray-800 truncate max-w-[200px]">
                    {archivo?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Peso en almacenamiento:</span>
                  <span className="font-bold text-[#3B2219]">
                    {archivo ? formatearBytes(archivo.size) : '0 B'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Drawer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2 shrink-0">
          {!mostrarConfirmacion ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="drawer-subir-form"
                disabled={!archivo || !titulo.trim()}
                className="px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {docExistenteEnDia ? 'Continuar (Actualizar Folio)' : 'Continuar a confirmación'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={subiendo}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Volver a editar
              </button>
              <button
                type="button"
                onClick={handleConfirmarSubida}
                disabled={subiendo}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {subiendo ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Subiendo a la nube...</span>
                  </>
                ) : (
                  <span>{docExistenteEnDia ? 'Actualizar Folio Ahora' : 'Confirmar y Publicar'}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
