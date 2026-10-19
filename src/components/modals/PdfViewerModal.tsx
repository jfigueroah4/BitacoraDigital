'use client';

import React, { useState } from 'react';
import { X, Download, Printer, Maximize2, Minimize2, FileText } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { Portal } from '@/components/ui/Portal';

interface PdfViewerModalProps {
  documento: DocumentoBitacora | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfViewerModal({ documento, isOpen, onClose }: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !documento) return null;

  const handlePrint = () => {
    const iframe = document.getElementById(isFullscreen ? 'pdf-frame-fs' : 'pdf-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.open(documento.urlPdf, '_blank');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documento.urlPdf;
    link.download = documento.nombreArchivo || `Bitacora_${documento.fecha}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modo ampliado pantalla completa: Solo el visor del PDF sin encabezado (igual que visor de imagen en DomunNet)
  if (isFullscreen) {
    return (
      <Portal>
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col font-poppins animate-fadeIn">
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
            title="Salir de pantalla completa"
          >
            <Minimize2 size={20} />
          </button>
          <iframe
            id="pdf-frame-fs"
            src={documento.urlPdf}
            title={documento.titulo}
            className="w-full h-full border-none"
          />
        </div>
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs font-poppins animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 w-full max-w-5xl h-[92vh] transition-all duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3B2219]/10 flex items-center justify-center text-[#3B2219]">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[280px] sm:max-w-md">
                  {documento.titulo}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span>Día {documento.dia}</span>
                  <span>&bull;</span>
                  <span>{documento.pesoFormateado}</span>
                  <span>&bull;</span>
                  <span>Subido por: <strong className="text-gray-700">{documento.subidoPor}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Ver en pantalla completa"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Imprimir folio"
              >
                <Printer size={16} />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Descargar PDF"
              >
                <Download size={16} />
              </button>
              <div className="h-5 w-px bg-gray-200 mx-1" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* PDF Viewer Body */}
          <div className="flex-1 bg-gray-100 relative">
            <iframe
              id="pdf-frame"
              src={documento.urlPdf}
              title={documento.titulo}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </Portal>
  );
}
