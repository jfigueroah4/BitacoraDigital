'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, FileText, Plus, Search, Eye, ChevronLeft, ChevronRight, PencilLine, Trash2, Files } from 'lucide-react';
import { MesInfo, DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES } from '@/lib/mockData';

interface VistaDiasProps {
  mesInfo: MesInfo;
  todosLosMeses?: MesInfo[];
  onVolverAMeses: () => void;
  onCambiarMes: (nuevoMes: number, nuevoAnio?: number) => void;
  onVerDocumento: (doc: DocumentoBitacora) => void;
  onEditarDocumento?: (doc: DocumentoBitacora) => void;
  onEliminarDocumento?: (doc: DocumentoBitacora) => void;
  esAdmin: boolean;
  onSubirParaDia: (dia: number) => void;
  onAbrirCargaMultiple?: () => void;
}

export default function VistaDias({
  mesInfo,
  todosLosMeses = [],
  onVolverAMeses,
  onCambiarMes,
  onVerDocumento,
  onEditarDocumento,
  onEliminarDocumento,
  esAdmin,
  onSubirParaDia,
  onAbrirCargaMultiple,
}: VistaDiasProps) {
  const [filtroDiaTexto, setFiltroDiaTexto] = useState('');

  // Map documents by day
  const docsPorDia = new Map<number, DocumentoBitacora>();
  mesInfo.documentos.forEach((d) => {
    docsPorDia.set(d.dia, d);
  });

  // Mostrar todos los días del mes de una vez
  const diasArray = Array.from({ length: mesInfo.totalDias }, (_, i) => i + 1);

  const diasFiltrados = diasArray.filter((dia) => {
    if (!filtroDiaTexto.trim()) return true;
    const doc = docsPorDia.get(dia);
    const q = filtroDiaTexto.toLowerCase();
    const matchDia = String(dia).includes(q);
    const matchDoc =
      doc &&
      (doc.titulo.toLowerCase().includes(q) ||
        doc.descripcion?.toLowerCase().includes(q) ||
        doc.nombreArchivo?.toLowerCase().includes(q));
    return matchDia || matchDoc;
  });

  // Selector de meses: Mostrar donde ya hayan registros
  const mesesConRegistros = todosLosMeses.filter((m) => m.diasConDocumentos > 0);
  const otrosMeses = todosLosMeses.filter((m) => m.diasConDocumentos === 0);

  // Asegurar que el mes actual esté en la lista
  const listaMesesSelector = [...mesesConRegistros];
  if (!listaMesesSelector.some((m) => m.mes === mesInfo.mes && m.anio === mesInfo.anio)) {
    listaMesesSelector.unshift(mesInfo);
  }

  const handleSelectMes = (val: string) => {
    const [anioStr, mesStr] = val.split('-');
    if (anioStr && mesStr) {
      onCambiarMes(Number(mesStr), Number(anioStr));
    } else {
      onCambiarMes(Number(val));
    }
  };

  const handleMesAnterior = () => {
    if (mesInfo.mes > 1) {
      onCambiarMes(mesInfo.mes - 1, mesInfo.anio);
    } else {
      onCambiarMes(12, mesInfo.anio - 1);
    }
  };

  const handleMesSiguiente = () => {
    if (mesInfo.mes < 12) {
      onCambiarMes(mesInfo.mes + 1, mesInfo.anio);
    } else {
      onCambiarMes(1, mesInfo.anio + 1);
    }
  };

  return (
    <div className="space-y-4 font-poppins animate-fadeIn">
      {/* Top Navigation & Subheader (Disminuido de tamaño, flecha sin fondo) */}
      <div className="bg-white rounded-xl border border-gray-200 px-3.5 py-3 sm:px-4 sm:py-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Flecha para volver sin fondo */}
            <button
              type="button"
              onClick={onVolverAMeses}
              className="p-1 text-gray-500 hover:text-[#3B2219] transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Volver al listado de meses"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">
                  Bitácora Electrónica &bull; {mesInfo.anio}
                </span>
                <span className="text-[10px] text-gray-300">&bull;</span>
                <span className="text-[10px] font-bold text-[#3B2219]">
                  {mesInfo.diasConDocumentos} de {mesInfo.totalDias} días con folio
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight mt-0.5">
                Bitácora {mesInfo.nombreMes} {mesInfo.anio}
              </h2>
            </div>
          </div>

          {/* Month selector & Search / Actions responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Quick Month Switcher con meses donde ya hayan registros */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 w-full sm:w-auto">
              <Calendar size={13} className="text-[#3B2219] shrink-0" />
              <select
                value={`${mesInfo.anio}-${mesInfo.mes}`}
                onChange={(e) => handleSelectMes(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer w-full sm:max-w-[190px]"
              >
                {mesesConRegistros.length > 0 ? (
                  <>
                    <optgroup label="Meses con registros">
                      {listaMesesSelector.map((m) => (
                        <option
                          key={`reg-${m.anio}-${m.mes}`}
                          value={`${m.anio}-${m.mes}`}
                        >
                          {m.nombreMes} {m.anio} ({m.diasConDocumentos}{' '}
                          {m.diasConDocumentos === 1 ? 'folio' : 'folios'})
                        </option>
                      ))}
                    </optgroup>
                    {otrosMeses.length > 0 && (
                      <optgroup label="Otros meses del proyecto">
                        {otrosMeses.map((m) => (
                          <option
                            key={`otr-${m.anio}-${m.mes}`}
                            value={`${m.anio}-${m.mes}`}
                          >
                            {m.nombreMes} {m.anio} (0 folios)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                ) : (
                  // Si aún no hay registros cargados, mostrar los meses disponibles
                  MESES_NOMBRES.map((nombre, idx) => (
                    <option key={idx} value={`${mesInfo.anio}-${idx + 1}`}>
                      {nombre} {mesInfo.anio}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Row of Search and Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Dia search */}
              <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1 h-[34px]">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filtrar por día o folio..."
                  value={filtroDiaTexto}
                  onChange={(e) => setFiltroDiaTexto(e.target.value)}
                  className="bg-transparent outline-none text-[11px] text-gray-800 placeholder-gray-400 w-full sm:w-36 font-medium"
                />
                {filtroDiaTexto && (
                  <button
                    type="button"
                    onClick={() => setFiltroDiaTexto('')}
                    className="text-gray-400 hover:text-gray-700 text-xs shrink-0"
                  >
                    &times;
                  </button>
                )}
              </div>

              {esAdmin && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {onAbrirCargaMultiple && (
                    <button
                      type="button"
                      onClick={onAbrirCargaMultiple}
                      className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-[#3B2219] hover:bg-[#F4ECE6]/50 text-gray-800 text-xs font-bold h-[34px] px-2.5 sm:px-3 rounded-lg shadow-2xs transition-all cursor-pointer"
                      title="Subir varios archivos en lote para diferentes fechas"
                    >
                      <Files size={14} className="text-[#3B2219]" strokeWidth={2.3} />
                      <span className="hidden sm:inline">Carga Múltiple</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSubirParaDia(new Date().getDate())}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold h-[34px] px-2.5 sm:px-3 rounded-lg shadow-2xs transition-colors duration-200 cursor-pointer"
                    title="Subir para este mes"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Subir para este mes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de TODOS los DÍAS del mes de una vez */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">
            Mostrando todos los días de {mesInfo.nombreMes} {mesInfo.anio}:
          </span>
          <span className="text-[10px] font-bold text-gray-400">
            {diasFiltrados.length} días
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {diasFiltrados.map((dia) => {
            const doc = docsPorDia.get(dia);
            const tieneDoc = Boolean(doc);

            return (
              <div
                key={dia}
                className={`relative rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 min-h-[98px] ${
                  tieneDoc
                    ? 'bg-gradient-to-br from-white to-[#F4ECE6]/40 border-[#3B2219]/25 shadow-2xs hover:border-[#3B2219] hover:shadow-xs cursor-pointer'
                    : 'bg-gray-50/60 border-gray-200/70 opacity-70 hover:opacity-100 hover:bg-white'
                }`}
                onClick={() => {
                  if (tieneDoc && doc) {
                    onVerDocumento(doc);
                  } else if (esAdmin) {
                    onSubirParaDia(dia);
                  }
                }}
              >
                {/* Day Header */}
                <div className="flex items-start justify-between">
                  <span
                    className={`text-sm font-black ${
                      tieneDoc ? 'text-[#3B2219]' : 'text-gray-400'
                    }`}
                  >
                    Día {dia}
                  </span>

                  {tieneDoc ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px]">
                      <FileText size={11} />
                    </span>
                  ) : esAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubirParaDia(dia);
                      }}
                      className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 hover:bg-[#3B2219] hover:text-white flex items-center justify-center transition-colors text-xs"
                      title="Subir documento para este día"
                    >
                      <Plus size={11} />
                    </button>
                  ) : null}
                </div>

                {/* Day Content */}
                {tieneDoc && doc ? (
                  <div className="my-1">
                    <p className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight">
                      {doc.titulo}
                    </p>
                    <span className="text-[9px] font-medium text-gray-500 mt-0.5 block">
                      {doc.pesoFormateado}
                    </span>
                  </div>
                ) : (
                  <div className="my-1 text-center py-1">
                    <span className="text-[9.5px] text-gray-400 italic">
                      Sin registro
                    </span>
                  </div>
                )}

                {/* Bottom Action */}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                  {tieneDoc && doc ? (
                    esAdmin ? (
                      <div className="w-full flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerDocumento(doc);
                          }}
                          className="flex-1 text-left text-[9.5px] font-bold text-[#3B2219] hover:underline flex items-center gap-1 py-0.5 cursor-pointer truncate"
                          title="Ver PDF"
                        >
                          <Eye size={11} className="shrink-0" />
                          <span className="truncate">Ver PDF</span>
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditarDocumento?.(doc);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-[#3B2219] hover:bg-[#F4ECE6] transition-colors cursor-pointer"
                            title="Editar folio"
                          >
                            <PencilLine size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminarDocumento?.(doc);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar folio"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDocumento(doc);
                        }}
                        className="w-full text-center text-[9.5px] font-bold text-[#3B2219] hover:underline flex items-center justify-center gap-1 py-0.5 cursor-pointer"
                      >
                        <Eye size={11} />
                        <span>Ver PDF</span>
                      </button>
                    )
                  ) : esAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubirParaDia(dia);
                      }}
                      className="w-full text-center text-[9.5px] font-semibold text-gray-500 hover:text-[#3B2219] flex items-center justify-center gap-0.5 py-0.5 cursor-pointer"
                    >
                      <Plus size={10} />
                      <span>Agregar</span>
                    </button>
                  ) : (
                    <span className="text-[8.5px] text-gray-300 w-full text-center">
                      No disponible
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra de navegación de mes con tipografía de 10px */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
        <div className="text-[10px] text-gray-500">
          Mostrando los <span className="font-bold text-gray-800">{diasFiltrados.length}</span> días de {mesInfo.nombreMes} {mesInfo.anio}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleMesAnterior}
            className="px-2 py-0.5 rounded-md border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            &laquo; Mes Anterior
          </button>

          <button
            type="button"
            onClick={handleMesSiguiente}
            className="px-2 py-0.5 rounded-md border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Mes Siguiente &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}
