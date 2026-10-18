'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, PencilLine, Calendar, FileText, UploadCloud, Loader2, Check } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES } from '@/lib/mockData';
import { formatearBytes } from '@/lib/supabase/storage';

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
}

export default function EditarDocumentoModal({
  documento,
  isOpen,
  onClose,
  onGuardar,
}: EditarDocumentoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dia, setDia] = useState(1);
  const [mes, setMes] = useState(1);
  const [anio, setAnio] = useState(2026);
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo || '');
      setDescripcion(documento.descripcion || '');
      setDia(documento.dia || 1);
      setMes(documento.mes || 1);
      setAnio(documento.anio || 2026);
      setNuevoArchivo(null);
    }
  }, [documento, isOpen]);

  if (!isOpen || !documento) return null;

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

  const getDiasEnMes = (m: number, a: number) => new Date(a, m, 0).getDate();
  const diasEnMesActual = getDiasEnMes(mes, anio);

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs animate-fadeIn"
        onClick={() => !guardando && onClose()}
      />
      <div className="fixed inset-y-0 right-0 z-[130] w-full max-w-md bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4ECE6] flex items-center justify-center text-[#3B2219]">
              <PencilLine size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Editar Folio de Bitácora
              </h3>
              <p className="text-[10px] text-gray-500">
                Modifica los datos del registro o actualiza el archivo PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Fecha Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1.5">
              <Calendar size={13} className="text-[#3B2219]" />
              <span>Fecha asignada (Día, Mes, Año) <span className="text-[#3B2219]">*</span></span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Día</label>
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

              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Mes</label>
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

              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-0.5">Año</label>
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
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219]"
            />
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
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219] resize-none"
            />
          </div>

          {/* Archivo PDF Actual y Reemplazo Opcional */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Archivo PDF
            </label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileText size={15} className="text-[#3B2219] shrink-0" />
                <span className="font-medium text-gray-800 truncate">
                  {nuevoArchivo ? nuevoArchivo.name : documento.nombreArchivo}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold shrink-0 ml-2">
                {nuevoArchivo ? formatearBytes(nuevoArchivo.size) : documento.pesoFormateado}
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-gray-300 hover:border-[#3B2219] rounded-xl p-3 text-center cursor-pointer transition-colors hover:bg-gray-50"
            >
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
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#3B2219] font-bold">
                <UploadCloud size={14} />
                <span>{nuevoArchivo ? 'Cambiar archivo seleccionado' : 'Reemplazar archivo PDF (opcional)'}</span>
              </div>
            </div>
          </div>

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
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
