'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, PencilLine, Calendar, FileText, UploadCloud, Loader2, Check } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES, getDiasEnMes } from '@/lib/mockData';
import { formatearBytes } from '@/lib/supabase/storage';
import { Portal } from '@/components/ui/Portal';

interface EditarDocumentoModalProps {
  documento: DocumentoBitacora | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (docActualizado: {
    id: string;
    titulo: string;
    descripcion: string;
    dia: number;
    mes: number;
    anio: number;
    file?: File;
  }) => Promise<void>;
  documentosExistentes?: DocumentoBitacora[];
}

export default function EditarDocumentoModal({
  documento,
  isOpen,
  onClose,
  onGuardar,
  documentosExistentes = [],
}: EditarDocumentoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dia, setDia] = useState(1);
  const [mes, setMes] = useState(1);
  const [anio, setAnio] = useState(2026);
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Días ocupados por otros documentos en el mismo mes y año (excluyendo el que se edita)
  const diasOcupados = useMemo(() => {
    if (!Array.isArray(documentosExistentes)) return new Set<number>();
    return new Set(
      documentosExistentes
        .filter((d) => d && d.id !== documento?.id && Number(d.mes) === mes && Number(d.anio) === anio)
        .map((d) => Number(d.dia))
    );
  }, [documentosExistentes, documento?.id, mes, anio]);

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo || '');
      setDescripcion(documento.descripcion || '');
      setDia(Number(documento.dia) || 1);
      setMes(Number(documento.mes) || 1);
      setAnio(Number(documento.anio) || 2026);
      setNuevoArchivo(null);
    }
  }, [documento, isOpen]);

  if (!isOpen || !documento) return null;

  const diasEnMesActual = Math.max(1, getDiasEnMes(mes, anio) || 31);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setGuardando(true);
    try {
      await onGuardar({
        id: documento.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        dia,
        mes,
        anio,
        file: nuevoArchivo || undefined,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => !guardando && onClose()}
      />

      <div className="fixed left-1/2 top-1/2 z-[10000] w-[92vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 font-poppins animate-scaleIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3B2219]/10 flex items-center justify-center text-[#3B2219]">
                <PencilLine size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                  Editar Folio de Bitácora
                </h3>
                <p className="text-[10px] text-gray-500">
                  Modifica los datos o reemplaza el PDF subido
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Título */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Título del Registro / Folio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] focus:bg-white transition-colors"
              />
            </div>

            {/* Fecha: Día, Mes, Año */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                <Calendar size={13} className="text-[#3B2219]" />
                <span>Fecha asignada</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Día</label>
                  <select
                    value={dia}
                    onChange={(e) => setDia(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                  >
                    {Array.from({ length: diasEnMesActual }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} disabled={diasOcupados.has(d)}>
                        Día {d} {diasOcupados.has(d) ? '(Ocupado)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => {
                      const nuevoMes = Number(e.target.value);
                      setMes(nuevoMes);
                      const maxDias = getDiasEnMes(nuevoMes, anio);
                      if (dia > maxDias) setDia(maxDias);
                    }}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                  >
                    {MESES_NOMBRES.map((nombre, idx) => (
                      <option key={idx} value={idx + 1}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Año</label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                  >
                    {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Observaciones Técnicas (Opcional)
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] focus:bg-white resize-none transition-colors"
              />
            </div>

            {/* Archivo actual / Reemplazo */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Documento PDF
              </label>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate max-w-[220px]">
                      {nuevoArchivo ? nuevoArchivo.name : documento.nombreArchivo}
                    </p>
                    <span className="text-[9.5px] text-gray-400">
                      {nuevoArchivo
                        ? `Nuevo: ${formatearBytes(nuevoArchivo.size)}`
                        : `Actual: ${documento.pesoFormateado}`}
                    </span>
                  </div>
                </div>

                <label className="text-[11px] font-bold text-[#3B2219] hover:underline cursor-pointer shrink-0">
                  {nuevoArchivo ? 'Cambiar otro' : 'Reemplazar PDF'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNuevoArchivo(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !titulo.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {guardando ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
