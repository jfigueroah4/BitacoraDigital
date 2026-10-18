'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertTriangle, ShieldCheck, Loader2, Calendar } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES, getDiasEnMes } from '@/lib/mockData';
import { subirDocumentoBitacora, formatearBytes } from '@/lib/supabase/storage';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

interface SubirDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaSugerido?: number;
  mesSugerido?: number;
  anioSugerido?: number;
  usuarioNombre: string;
  onDocumentoSubido: (doc: DocumentoBitacora) => void;
}

export default function SubirDocumentoModal({
  isOpen,
  onClose,
  diaSugerido = new Date().getDate(),
  mesSugerido = new Date().getMonth() + 1,
  anioSugerido = 2026,
  usuarioNombre,
  onDocumentoSubido,
}: SubirDocumentoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dia, setDia] = useState<number>(diaSugerido);
  const [mes, setMes] = useState<number>(mesSugerido);
  const [anio, setAnio] = useState<number>(anioSugerido);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Update when suggested day/month changes
  useEffect(() => {
    if (diaSugerido) setDia(diaSugerido);
    if (mesSugerido) setMes(mesSugerido);
    if (anioSugerido) setAnio(anioSugerido);
  }, [diaSugerido, mesSugerido, anioSugerido, isOpen]);

  // Handle escape key
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

  const diasEnMesActual = getDiasEnMes(mes, anio);

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
      showSuccessToast(`¡Bitácora del día ${dia} de ${MESES_NOMBRES[mes - 1]} subida exitosamente!`);
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

  const pesoBytes = archivo ? archivo.size : 0;
  const esPesoOptimo = pesoBytes <= 150 * 1024; // <= 150 KB (~100 KB objetivo)
  const esPesoAceptable = pesoBytes > 150 * 1024 && pesoBytes <= 2 * 1024 * 1024; // <= 2 MB

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={() => {
          if (!subiendo) onClose();
        }}
      />

      {/* Drawer Panel lateral */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
        {/* Header del Drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4ECE6] flex items-center justify-center text-[#3B2219]">
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

        {/* Content del Drawer */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!mostrarConfirmacion ? (
            <form id="drawer-subir-form" onSubmit={handleValidarAntesDeConfirmar} className="space-y-4">
              {/* Fecha Selector en orden: DÍA, MES, AÑO */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1.5">
                  <Calendar size={13} className="text-[#3B2219]" />
                  <span>Fecha de registro (Día, Mes, Año) <span className="text-[#3B2219]">*</span></span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {/* 1. DÍA con numeración de días del mes */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">
                      Día
                    </label>
                    <select
                      value={dia}
                      onChange={(e) => setDia(Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                    >
                      {Array.from({ length: diasEnMesActual }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Día {d}
                        </option>
                      ))}
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
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Título o Folio */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Título del Registro / Folio <span className="text-[#3B2219]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Folio 045 - Avance Terracería Estación 14+250"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219]"
                />
              </div>

              {/* Observaciones o Descripción */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Observaciones Técnicas (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas de campo, compactación, ensayos o eventos relevantes..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] resize-none"
                />
              </div>

              {/* Dropzone de Archivo PDF */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Documento PDF de Bitácora <span className="text-[#3B2219]">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#3B2219] bg-[#F4ECE6]/50'
                      : archivo
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-gray-200 hover:border-[#3B2219] hover:bg-gray-50'
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
                  ¿Confirmar publicación de bitácora?
                </h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  El documento se guardará de inmediato y estará disponible en el calendario de obra.
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha asignada:</span>
                  <span className="font-bold text-gray-800">
                    Día {dia} de {MESES_NOMBRES[mes - 1]} de {anio}
                  </span>
                </div>
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
                Continuar a confirmación
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
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarSubida}
                disabled={subiendo}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                {subiendo ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Subiendo documento...</span>
                  </>
                ) : (
                  <span>Confirmar y Subir</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
