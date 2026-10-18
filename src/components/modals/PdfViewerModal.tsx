'use client';

import React, { useState } from 'react';
import { X, Download, Printer, Maximize2, Minimize2, FileText } from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';

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
      <div className="fixed inset-0 z-[110] bg-black flex flex-col font-poppins animate-fadeIn">
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
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs font-poppins animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 w-full max-w-5xl h-[92vh] transition-all duration-200">
        {/* Encabezado compacto para maximizar el área del visor PDF */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-200 bg-gray-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#F4ECE6] flex items-center justify-center text-[#3B2219] shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {documento.titulo}
              </h3>
              <p className="text-[11px] text-gray-500 truncate">
                {documento.nombreArchivo} &bull; {documento.pesoFormateado} &bull; {documento.fecha} (Día {documento.dia})
              </p>
            </div>
          </div>

          {/* Botones de acción sin fondo y solo iconos */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Imprimir documento"
            >
              <Printer size={16} />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Descargar PDF"
            >
              <Download size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Ampliar pantalla completa"
            >
              <Maximize2 size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ml-1"
              title="Cerrar visor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Visor PDF */}
        <div className="flex-1 w-full bg-neutral-900 overflow-hidden relative">
          <iframe
            id="pdf-frame"
            src={documento.urlPdf}
            title={documento.titulo}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}
