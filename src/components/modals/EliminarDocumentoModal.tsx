'use client';

import React from 'react';
import { Trash2, X, AlertTriangle, FileText } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { Portal } from '@/components/ui/Portal';

interface EliminarDocumentoModalProps {
  documento: DocumentoBitacora | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eliminando?: boolean;
}

export default function EliminarDocumentoModal({
  documento,
  isOpen,
  onClose,
  onConfirm,
  eliminando = false,
}: EliminarDocumentoModalProps) {
  if (!isOpen || !documento) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs animate-fadeIn"
        onClick={() => !eliminando && onClose()}
      />
      <div className="fixed left-1/2 top-1/2 z-[10000] w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 font-poppins animate-scaleIn">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100">
          {/* Barra superior con gradiente de peligro */}
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 to-[#3B2219]" />

          <button
            type="button"
            onClick={onClose}
            disabled={eliminando}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-4 ring-red-50/50">
              <Trash2 size={24} />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              ¿Eliminar documento de bitácora?
            </h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Esta acción eliminará el archivo PDF y su registro correspondiente del calendario de obra.
            </p>
          </div>

          {/* Tarjeta con los datos del folio a eliminar */}
          <div className="my-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-gray-800 font-bold">
              <FileText size={14} className="text-[#3B2219]" />
              <span className="truncate">{documento.titulo}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
              <span>Fecha:</span>
              <span className="font-semibold text-gray-700">
                Día {documento.dia}/{documento.mes}/{documento.anio}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Archivo:</span>
              <span className="font-semibold text-gray-700 truncate max-w-[190px]">
                {documento.nombreArchivo}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={eliminando}
              className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={eliminando}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
