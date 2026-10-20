'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  Plus,
  ChevronLeft,
  Clock,
  Settings,
  X,
  Check,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { MesInfo } from '@/types/bitacora';
import { DuracionProyecto, MESES_NOMBRES } from '@/lib/mockData';

interface VistaMesesProps {
  meses: MesInfo[];
  anioActual: number | 'todos';
  onAnioChange?: (val: number | 'todos') => void;
  mesFiltro?: number | 'todos';
  onMesFiltroChange?: (val: number | 'todos') => void;
  onSeleccionarMes: (mesNum: number, anio?: number) => void;
  esAdmin: boolean;
  onAbrirSubida: () => void;
  fechaInicio: string;
  fechaFin: string;
  onFechaInicioChange: (val: string) => void;
  onFechaFinChange: (val: string) => void;
  onLimpiarFiltros: () => void;
  duracionProyecto: DuracionProyecto;
  onGuardarDuracion: (nueva: DuracionProyecto) => void;
}

const ANIOS_DISPONIBLES = [
  2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
  2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2045, 2046
];

/**
 * Combobox interactivo para Mes: Permite escribir o seleccionar entre los 12 meses
 */
function ComboboxMes({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (mes: number) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const mesActualNombre = MESES_NOMBRES[value - 1] || 'Enero';

  useEffect(() => {
    if (!isOpen) {
      setQuery(mesActualNombre);
    }
  }, [value, isOpen, mesActualNombre]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(mesActualNombre);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mesActualNombre]);

  const mesesFiltrados = useMemo(() => {
    if (!query.trim()) {
      return MESES_NOMBRES.map((nombre, i) => ({ nombre, mes: i + 1 }));
    }
    const q = query.toLowerCase().trim();
    return MESES_NOMBRES.map((nombre, i) => ({ nombre, mes: i + 1 })).filter((m) =>
      m.nombre.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            const matchIndex = MESES_NOMBRES.findIndex(
              (m) => m.toLowerCase() === e.target.value.toLowerCase().trim()
            );
            if (matchIndex !== -1) {
              onChange(matchIndex + 1);
            }
          }}
          placeholder="Escribe o selecciona..."
          className="w-full px-3 py-2 pr-8 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] focus:ring-1 focus:ring-[#3B2219] transition-all cursor-text shadow-2xs"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setQuery('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#3B2219]' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl py-1 font-poppins animate-fadeIn">
          {mesesFiltrados.length > 0 ? (
            mesesFiltrados.map((item) => {
              const isSelected = item.mes === value;
              return (
                <button
                  key={item.mes}
                  type="button"
                  onClick={() => {
                    onChange(item.mes);
                    setQuery(item.nombre);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4ECE6] text-[#3B2219] font-bold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <span>{item.nombre}</span>
                  {isSelected && <Check size={13} className="text-[#3B2219]" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-center text-xs text-gray-400">
              No se encontró ningún mes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Combobox interactivo para Año: Permite escribir directamente o seleccionar entre 10+ años desde 2026
 */
function ComboboxAnio({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (anio: number) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(String(value));
  const containerRef = useRef<HTMLDivElement>(null);

  // Lista completa de años disponibles
  const aniosDisponibles = useMemo(() => {
    const list: number[] = [];
    for (let y = 2024; y <= 2040; y++) {
      list.push(y);
    }
    return list;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery(String(value));
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const parsed = parseInt(query, 10);
        if (!isNaN(parsed) && parsed >= 1990 && parsed <= 2100) {
          onChange(parsed);
          setQuery(String(parsed));
        } else {
          setQuery(String(value));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value, onChange]);

  const aniosFiltrados = useMemo(() => {
    // Si la búsqueda coincide con el año actual seleccionado o está vacía, mostrar TODOS los años disponibles
    if (!query.trim() || query.trim() === String(value)) {
      return aniosDisponibles;
    }
    const q = query.trim();
    const filtrados = aniosDisponibles.filter((a) => String(a).includes(q));
    return filtrados.length > 0 ? filtrados : aniosDisponibles;
  }, [query, value, aniosDisponibles]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="number"
          value={query}
          disabled={disabled}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            const parsed = parseInt(e.target.value, 10);
            if (!isNaN(parsed) && parsed >= 1990 && parsed <= 2100) {
              onChange(parsed);
            }
          }}
          placeholder="Ej. 2026"
          className="w-full px-3 py-2 pr-8 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] focus:ring-1 focus:ring-[#3B2219] transition-all cursor-text shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setQuery(String(value));
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#3B2219]' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl py-1 font-poppins animate-fadeIn">
          {aniosFiltrados.length > 0 ? (
            aniosFiltrados.map((a) => {
              const isSelected = a === value;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    onChange(a);
                    setQuery(String(a));
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4ECE6] text-[#3B2219] font-bold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <span>{a}</span>
                  {isSelected && <Check size={13} className="text-[#3B2219]" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-center text-xs text-gray-400">
              Presiona Enter o haz clic fuera para usar {query}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VistaMeses({
  meses,
  anioActual,
  onAnioChange,
  mesFiltro = 'todos',
  onMesFiltroChange,
  onSeleccionarMes,
  esAdmin,
  onAbrirSubida,
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  onLimpiarFiltros,
  duracionProyecto,
  onGuardarDuracion,
}: VistaMesesProps) {
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);
  const hayFiltrosFecha = Boolean(fechaInicio || fechaFin);
  const hayFiltrosActivos = Boolean(
    fechaInicio ||
    fechaFin ||
    anioActual !== 'todos' ||
    (mesFiltro && mesFiltro !== 'todos')
  );

  // Portal mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal para configurar duración del proyecto
  const [modalDuracionAbierto, setModalDuracionAbierto] = useState(false);
  const [tempMesInicio, setTempMesInicio] = useState(duracionProyecto.mesInicio);
  const [tempAnioInicio, setTempAnioInicio] = useState(duracionProyecto.anioInicio);
  const [tempMesFin, setTempMesFin] = useState(duracionProyecto.mesFin);
  const [tempAnioFin, setTempAnioFin] = useState(duracionProyecto.anioFin);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 12;
  const totalPaginas = Math.ceil(meses.length / registrosPorPagina) || 1;

  const inicioIdx = (paginaActual - 1) * registrosPorPagina;
  const mesesPaginados = meses.slice(inicioIdx, inicioIdx + registrosPorPagina);

  const totalFolios = meses.reduce((acc, m) => acc + m.diasConDocumentos, 0);

  // Validación: la fecha de fin DEBE ser mayor a la fecha de inicio (no pueden ser iguales ni fin menor)
  const fechaInicioVal = tempAnioInicio * 12 + tempMesInicio;
  const fechaFinVal = tempAnioFin * 12 + tempMesFin;
  const esInvalido = fechaFinVal < fechaInicioVal;
  const totalMesesDuracion = !esInvalido ? Math.max(1, fechaFinVal - fechaInicioVal + 1) : 0;

  const handleAbrirModalDuracion = () => {
    setTempMesInicio(duracionProyecto.mesInicio);
    setTempAnioInicio(duracionProyecto.anioInicio);
    setTempMesFin(duracionProyecto.mesFin);
    setTempAnioFin(duracionProyecto.anioFin);
    setModalDuracionAbierto(true);
  };

  const handleGuardarDuracion = (e: React.FormEvent) => {
    e.preventDefault();
    if (esInvalido) return;

    onGuardarDuracion({
      mesInicio: tempMesInicio,
      anioInicio: tempAnioInicio,
      mesFin: tempMesFin,
      anioFin: tempAnioFin,
    });
    setModalDuracionAbierto(false);
    setPaginaActual(1);
  };

  const nombreMesInicio = MESES_NOMBRES[duracionProyecto.mesInicio - 1] || 'Enero';
  const nombreMesFin = MESES_NOMBRES[duracionProyecto.mesFin - 1] || 'Diciembre';

  return (
    <div className="space-y-4 font-poppins animate-fadeIn">
      {/* Título en grande centrado sin ningún fondo distinto */}
      <div className="text-center pt-1 pb-3 select-none">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 uppercase">
          Bitácora Electrónica
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-gray-500 tracking-wider mt-0.5">
          Proyecto: Conexion VAS - Hincapie
        </p>
      </div>

      {/* Top Controls Bar */}
      <div className="space-y-3">
        {/* Fila 1: Duración del Proyecto adaptada con diseño responsivo en mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Tarjeta de Duración responsiva que no comprime el texto en pantallas pequeñas */}
          <div className="w-full sm:w-auto flex items-center justify-between gap-2.5 bg-white border border-gray-200 rounded-2xl p-2.5 sm:px-3.5 sm:py-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#F4ECE6] flex items-center justify-center shrink-0 text-[#3B2219]">
                <Clock size={15} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                  Duración:
                </span>
                <span className="text-xs font-semibold text-gray-800 sm:font-normal sm:text-gray-700 truncate">
                  {nombreMesInicio} {duracionProyecto.anioInicio} — {nombreMesFin} {duracionProyecto.anioFin}
                </span>
              </div>
            </div>
            {esAdmin && (
              <button
                type="button"
                onClick={handleAbrirModalDuracion}
                className="shrink-0 bg-[#F4ECE6] hover:bg-[#ebdcd1] text-[#3B2219] text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-2"
                title="Establecer duración del proyecto"
              >
                <Settings size={13} />
                <span>Establecer</span>
              </button>
            )}
          </div>

          {/* Contador de folios */}
          <div className="self-end sm:self-auto text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
            <span className="text-[#3B2219] font-bold">{totalFolios}</span> folios subidos
          </div>
        </div>

        {/* Fila 2: En mobile botón toggle para filtros estilo DomunNet y en Desktop barra completa */}
        <div className="flex flex-col gap-2.5">
          {/* Barra superior de acción en Mobile */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                hayFiltrosActivos
                  ? 'bg-[#3B2219] text-white border-[#3B2219]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={13} />
              <span>Filtrar por rango</span>
              {hayFiltrosActivos && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>

            {esAdmin && (
              <button
                type="button"
                onClick={onAbrirSubida}
                className="inline-flex items-center gap-1.5 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Subir Documento</span>
              </button>
            )}
          </div>

          {/* Barra de Filtros en Desktop (siempre visible en horizontal) */}
          <div className="hidden sm:flex sm:items-center justify-between gap-3 bg-transparent p-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Filter size={14} className="text-[#3B2219]" />
                <span>Filtrar por rango:</span>
              </div>

              {/* Rango de Fechas: Inicio y Fin */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Inicio:</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => onFechaInicioChange(e.target.value)}
                    className="bg-transparent text-xs text-gray-800 outline-none font-medium w-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Fin:</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => onFechaFinChange(e.target.value)}
                    className="bg-transparent text-xs text-gray-800 outline-none font-medium w-full"
                  />
                </div>
              </div>

              {/* Selectores de Mes y Año en Desktop */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Mes:</span>
                  <select
                    value={mesFiltro ?? 'todos'}
                    onChange={(e) => {
                      const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                      onMesFiltroChange?.(val);
                      setPaginaActual(1);
                    }}
                    className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="todos">Todos los meses</option>
                    {MESES_NOMBRES.map((nombre, idx) => (
                      <option key={idx} value={idx + 1}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Año:</span>
                  <select
                    value={anioActual}
                    onChange={(e) => {
                      const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                      onAnioChange?.(val);
                      setPaginaActual(1);
                    }}
                    className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="todos">Todos los años</option>
                    {ANIOS_DISPONIBLES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón Limpiar Filtros en Desktop */}
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={() => {
                    onLimpiarFiltros();
                    onAnioChange?.('todos');
                    onMesFiltroChange?.('todos');
                  }}
                  className="text-xs text-[#3B2219] hover:underline font-semibold px-2 py-1 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Lado derecho en Desktop: Botón Subir Documento */}
            {esAdmin && (
              <button
                type="button"
                onClick={onAbrirSubida}
                className="hidden sm:inline-flex items-center justify-center gap-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-colors duration-200 cursor-pointer shrink-0"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Subir Documento</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Meses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {mesesPaginados.map((m) => {
          const tieneDocs = m.diasConDocumentos > 0;

          return (
            <button
              key={`${m.anio}-${m.mes}`}
              type="button"
              onClick={() => onSeleccionarMes(m.mes, m.anio)}
              className={`group text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-[114px] cursor-pointer shadow-2xs hover:shadow-sm ${
                tieneDocs
                  ? 'bg-white hover:border-[#3B2219] border-gray-200'
                  : 'bg-white hover:border-[#3B2219] border-gray-200/90'
              }`}
            >
              {/* Barra indicadora superior */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                  tieneDocs
                    ? 'bg-[#3B2219]'
                    : 'bg-gray-100 group-hover:bg-[#3B2219]'
                }`}
              />

              {/* Top info */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">
                    Mes {String(m.mes).padStart(2, '0')} &bull; {m.anio}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#3B2219] transition-colors mt-0.5">
                    {m.nombreMes} {m.anio}
                  </h3>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    tieneDocs
                      ? 'bg-[#F4ECE6] text-[#3B2219] group-hover:bg-[#3B2219] group-hover:text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-[#F4ECE6] group-hover:text-[#3B2219]'
                  }`}
                >
                  <Calendar size={15} />
                </div>
              </div>

              {/* Bottom stats & badge */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <FileText
                    size={13}
                    className={tieneDocs ? 'text-[#3B2219]' : 'text-gray-400'}
                  />
                  <span
                    className={`font-bold ${
                      tieneDocs ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {m.diasConDocumentos}{' '}
                    <span className="font-normal text-gray-400">
                      {m.diasConDocumentos === 1 ? 'día con folio' : 'días registrados'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10.5px] font-bold text-[#3B2219] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Ver días</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Paginación */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
        <div className="text-[10px] text-gray-500">
          Mostrando <span className="font-bold text-gray-800">{mesesPaginados.length}</span> de{' '}
          <span className="font-bold text-gray-800">{meses.length}</span> meses correspondientes
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft size={13} />
          </button>

          <span className="text-[10px] font-semibold px-2 py-0.5 text-gray-700 bg-gray-50 rounded-md border border-gray-200">
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Página siguiente"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Modal de Filtros en Mobile estilo DomunNet */}
      {mounted && mostrarFiltrosMobile && createPortal(
        <div className="fixed inset-0 z-[9999] sm:hidden flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop con clic para cerrar */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setMostrarFiltrosMobile(false)}
          />

          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-slideUp font-poppins"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F4ECE6] flex items-center justify-center text-[#3B2219]">
                  <Filter size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    Filtros de Búsqueda
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Filtra la bitácora por rango de fechas, mes o año
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarFiltrosMobile(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido de Filtros */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Rango de Fechas */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-[#3B2219] uppercase tracking-wider block">
                  Rango de Fechas
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <span className="text-[9.5px] font-bold text-gray-400 uppercase block mb-0.5">
                      Desde:
                    </span>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => onFechaInicioChange(e.target.value)}
                      className="bg-transparent text-xs text-gray-800 outline-none font-medium w-full"
                    />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <span className="text-[9.5px] font-bold text-gray-400 uppercase block mb-0.5">
                      Hasta:
                    </span>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => onFechaFinChange(e.target.value)}
                      className="bg-transparent text-xs text-gray-800 outline-none font-medium w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Mes */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-[#3B2219] uppercase tracking-wider block">
                  Mes
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <select
                    value={mesFiltro ?? 'todos'}
                    onChange={(e) => {
                      const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                      onMesFiltroChange?.(val);
                      setPaginaActual(1);
                    }}
                    className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer w-full"
                  >
                    <option value="todos">Todos los meses</option>
                    {MESES_NOMBRES.map((nombre, idx) => (
                      <option key={idx} value={idx + 1}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de Año */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-[#3B2219] uppercase tracking-wider block">
                  Año
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <select
                    value={anioActual}
                    onChange={(e) => {
                      const val = e.target.value === 'todos' ? 'todos' : Number(e.target.value);
                      onAnioChange?.(val);
                      setPaginaActual(1);
                    }}
                    className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer w-full"
                  >
                    <option value="todos">Todos los años</option>
                    {ANIOS_DISPONIBLES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer de Acciones estilo DomunNet */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              {hayFiltrosActivos ? (
                <button
                  type="button"
                  onClick={() => {
                    onLimpiarFiltros();
                    onAnioChange?.('todos');
                    onMesFiltroChange?.('todos');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline px-2 py-1.5 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Sin filtros aplicados</span>
              )}

              <button
                type="button"
                onClick={() => setMostrarFiltrosMobile(false)}
                className="bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer ml-auto"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para establecer la duración del proyecto renderizado en el portal de document.body para evitar desalineaciones */}
      {mounted && modalDuracionAbierto && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          {/* Backdrop con clic para cerrar */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setModalDuracionAbierto(false)}
          />

          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-visible flex flex-col my-auto animate-scaleIn font-poppins"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F4ECE6] flex items-center justify-center text-[#3B2219]">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    Establecer Duración del Proyecto
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Define los meses y años correspondientes de la bitácora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDuracionAbierto(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarDuracion} className="p-5 space-y-4 text-xs">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Define el rango de inicio y fin de la obra para generar automáticamente todos los meses correspondientes en la bitácora digital. Puedes seleccionar de la lista o escribir el mes y año.
              </p>

              {/* Rango de Inicio */}
              <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[10.5px] font-bold text-[#3B2219] uppercase tracking-wider block">
                  Inicio de la Obra
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                      Mes:
                    </label>
                    <ComboboxMes
                      value={tempMesInicio}
                      onChange={(mes) => setTempMesInicio(mes)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                      Año (Escribe o selecciona):
                    </label>
                    <ComboboxAnio
                      value={tempAnioInicio}
                      onChange={(anio) => setTempAnioInicio(anio)}
                    />
                  </div>
                </div>
              </div>

              {/* Rango de Término */}
              <div
                className={`border rounded-xl p-3.5 space-y-2 transition-colors ${
                  esInvalido
                    ? 'bg-red-50/40 border-red-300'
                    : 'bg-gray-50/90 border-gray-200'
                }`}
              >
                <span className="text-[10.5px] font-bold text-[#3B2219] uppercase tracking-wider block">
                  Término de la Obra
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                      Mes:
                    </label>
                    <ComboboxMes
                      value={tempMesFin}
                      onChange={(mes) => setTempMesFin(mes)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                      Año (Escribe o selecciona):
                    </label>
                    <ComboboxAnio
                      value={tempAnioFin}
                      onChange={(anio) => setTempAnioFin(anio)}
                    />
                  </div>
                </div>
              </div>

              {/* Alerta de Validación o Resumen */}
              {esInvalido ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-[11px] animate-fadeIn">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Rango de fechas no válido</p>
                    <p className="text-red-600 mt-0.5 leading-snug">
                      La fecha de término debe ser posterior a la fecha de inicio. No pueden ser iguales ni la fecha de fin puede ser menor a la de inicio.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-[11px] animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>
                      Duración válida: {totalMesesDuracion} meses calculados
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {MESES_NOMBRES[tempMesInicio - 1]} {tempAnioInicio} &rarr; {MESES_NOMBRES[tempMesFin - 1]} {tempAnioFin}
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalDuracionAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={esInvalido}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={14} />
                  <span>Aplicar Duración</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
