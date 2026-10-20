'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Files,
  UploadCloud,
  FileText,
  Trash2,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Info,
} from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES, getDiasEnMes } from '@/lib/mockData';
import { subirDocumentoBitacora, formatearBytes } from '@/lib/supabase/storage';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { Portal } from '@/components/ui/Portal';

export interface ItemCargaMultiple {
  id: string;
  dia: number;
  mes: number;
  anio: number;
  titulo: string;
  descripcion: string;
  archivo: File | null;
}

interface CargaMultipleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mesActual?: number;
  anioActual?: number;
  usuarioNombre: string;
  onDocumentosSubidos: (docs: DocumentoBitacora[]) => void;
  mesBloqueado?: boolean;
  documentosExistentes?: DocumentoBitacora[];
}

const CANTIDADES_RAPIDAS = [2, 4, 8];
const ITEMS_POR_PAGINA = 2; // Paginación después del 2do documento

export default function CargaMultipleDrawer({
  isOpen,
  onClose,
  mesActual,
  anioActual,
  usuarioNombre,
  onDocumentosSubidos,
  mesBloqueado = false,
  documentosExistentes = [],
}: CargaMultipleDrawerProps) {
  const hoyInicial = new Date();
  const diaHoyInicial = hoyInicial.getDate();
  const mesRefInicial = Number(mesActual) || hoyInicial.getMonth() + 1;
  const anioRefInicial = Number(anioActual) || hoyInicial.getFullYear();
  const maxDiasInicial = getDiasEnMes(mesRefInicial, anioRefInicial) || 31;

  // Inicializar items con 3 elementos por defecto para evitar estado vacío
  const [items, setItems] = useState<ItemCargaMultiple[]>(() =>
    Array.from({ length: 2 }, (_, i) => ({
      id: `item-${Date.now()}-${i}`,
      dia: Math.min(maxDiasInicial, Math.max(1, diaHoyInicial + i)),
      mes: mesRefInicial,
      anio: anioRefInicial,
      titulo: '',
      descripcion: '',
      archivo: null,
    }))
  );

  const [subiendo, setSubiendo] = useState(false);
  const [progresoActual, setProgresoActual] = useState({ actual: 0, total: 0 });
  const [paginaActual, setPaginaActual] = useState(1);
  const [cantidadPersonalizada, setCantidadPersonalizada] = useState('2');

  // Sincronizar items al abrir el drawer
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const diaHoy = hoy.getDate();
      const mesInicial = Number(mesActual) || hoy.getMonth() + 1;
      const anioInicial = Number(anioActual) || hoy.getFullYear();
      const maxDias = getDiasEnMes(mesInicial, anioInicial) || 31;

      const itemsIniciales: ItemCargaMultiple[] = Array.from({ length: 2 }, (_, i) => ({
        id: `item-${Date.now()}-${i}`,
        dia: Math.min(maxDias, Math.max(1, diaHoy + i)),
        mes: mesInicial,
        anio: anioInicial,
        titulo: '',
        descripcion: '',
        archivo: null,
      }));

      setItems(itemsIniciales);
      setPaginaActual(1);
      setCantidadPersonalizada('2');
      setSubiendo(false);
      setProgresoActual({ actual: 0, total: 0 });
    }
  }, [isOpen, mesActual, anioActual]);

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

  // Total de páginas calculadas
  const totalPaginas = Math.max(1, Math.ceil(items.length / ITEMS_POR_PAGINA));

  // Asegurar que la página actual no sobrepase el total
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);

  // Lista segura de documentos existentes
  const docsValidos = useMemo(() => {
    if (!Array.isArray(documentosExistentes)) return [];
    return documentosExistentes.filter((d) => Boolean(d && typeof d === 'object'));
  }, [documentosExistentes]);

  if (!isOpen) return null;

  // Ajustar la cantidad total de archivos a subir
  const handleAjustarCantidad = (nuevaCantidad: number) => {
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;
    const diff = nuevaCantidad - items.length;

    if (diff > 0) {
      const hoy = new Date();
      const nuevos: ItemCargaMultiple[] = Array.from({ length: diff }, (_, i) => {
        const ultimoItem = items[items.length - 1];
        const mesRef = mesBloqueado ? Number(mesActual) || (hoy.getMonth() + 1) : ultimoItem ? ultimoItem.mes : (hoy.getMonth() + 1);
        const anioRef = mesBloqueado ? Number(anioActual) || hoy.getFullYear() : ultimoItem ? ultimoItem.anio : hoy.getFullYear();
        const maxDias = getDiasEnMes(mesRef, anioRef) || 31;
        const diaSiguiente = ultimoItem ? Math.min(maxDias, ultimoItem.dia + 1) : hoy.getDate();

        return {
          id: `item-${Date.now()}-${items.length + i}`,
          dia: diaSiguiente,
          mes: mesRef,
          anio: anioRef,
          titulo: '',
          descripcion: '',
          archivo: null,
        };
      });
      setItems([...items, ...nuevos]);
    } else if (diff < 0) {
      setItems(items.slice(0, nuevaCantidad));
    }
    setCantidadPersonalizada(String(nuevaCantidad));
  };

  const handleAgregarItem = () => {
    const hoy = new Date();
    const ultimoItem = items[items.length - 1];
    const mesRef = mesBloqueado ? Number(mesActual) || (hoy.getMonth() + 1) : ultimoItem ? ultimoItem.mes : (hoy.getMonth() + 1);
    const anioRef = mesBloqueado ? Number(anioActual) || hoy.getFullYear() : ultimoItem ? ultimoItem.anio : hoy.getFullYear();
    const maxDias = getDiasEnMes(mesRef, anioRef) || 31;
    const diaSiguiente = ultimoItem ? Math.min(maxDias, ultimoItem.dia + 1) : hoy.getDate();

    const nuevos = [
      ...items,
      {
        id: `item-${Date.now()}-${items.length}`,
        dia: diaSiguiente,
        mes: mesRef,
        anio: anioRef,
        titulo: '',
        descripcion: '',
        archivo: null,
      },
    ];
    setItems(nuevos);
    setCantidadPersonalizada(String(nuevos.length));
    const nuevaPagina = Math.ceil(nuevos.length / ITEMS_POR_PAGINA);
    setPaginaActual(nuevaPagina);
  };

  const handleEliminarItem = (id: string) => {
    if (items.length <= 1) {
      showErrorToast('Debes mantener al menos un documento en la lista.');
      return;
    }
    const filtrados = items.filter((item) => item.id !== id);
    setItems(filtrados);
    setCantidadPersonalizada(String(filtrados.length));
  };

  const handleQuitarArchivo = (id: string) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            archivo: null,
          };
        }
        return it;
      })
    );
  };

  const handleActualizarItem = (id: string, campo: keyof ItemCargaMultiple, valor: any) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [campo]: valor };
          if (campo === 'mes' || campo === 'anio') {
            const maxDias = getDiasEnMes(
              campo === 'mes' ? Number(valor) : it.mes,
              campo === 'anio' ? Number(valor) : it.anio
            ) || 31;
            if (updated.dia > maxDias) {
              updated.dia = maxDias;
            }
          }
          return updated;
        }
        return it;
      })
    );
  };

  const handleFileSelect = (id: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showErrorToast('Por favor selecciona un documento en formato PDF.');
      return;
    }

    setItems(
      items.map((it) => {
        if (it.id === id) {
          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          return {
            ...it,
            archivo: file,
            titulo: it.titulo || `Folio Día ${it.dia} - ${nombreLimpio}`,
          };
        }
        return it;
      })
    );
  };

  const itemsConArchivo = items.filter((it) => it.archivo !== null);

  // Subir todos los documentos conservando solo el primero si coinciden en el día
  const handleSubirTodos = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsConArchivo.length === 0) {
      showErrorToast('Debes adjuntar al menos un archivo PDF para realizar la carga múltiple.');
      return;
    }

    // Validar que todos los que tengan archivo tengan título
    for (let i = 0; i < itemsConArchivo.length; i++) {
      if (!itemsConArchivo[i].titulo.trim()) {
        showErrorToast(`Ingresa un título para el documento #${i + 1}.`);
        return;
      }
    }

    // Filtrar duplicados por fecha: SE MANTIENE SOLO EL PRIMERO QUE SE SUBIÓ EN ESE DÍA
    const diasVistos = new Map<string, ItemCargaMultiple>();
    const itemsADepositar: ItemCargaMultiple[] = [];
    let duplicadosDescartados = 0;

    itemsConArchivo.forEach((item) => {
      const claveFecha = `${item.anio}-${item.mes}-${item.dia}`;
      if (!diasVistos.has(claveFecha)) {
        diasVistos.set(claveFecha, item);
        itemsADepositar.push(item);
      } else {
        duplicadosDescartados++;
      }
    });

    setSubiendo(true);
    setProgresoActual({ actual: 0, total: itemsADepositar.length });

    const nuevosDocsSubidos: DocumentoBitacora[] = [];

    try {
      for (let i = 0; i < itemsADepositar.length; i++) {
        const item = itemsADepositar[i];
        setProgresoActual({ actual: i + 1, total: itemsADepositar.length });

        if (item.archivo) {
          const docSubido = await subirDocumentoBitacora({
            file: item.archivo,
            dia: item.dia,
            mes: item.mes,
            anio: item.anio,
            titulo: item.titulo.trim(),
            descripcion: item.descripcion.trim(),
            subidoPor: usuarioNombre || 'Administrador',
            subidoPorRol: 'Administrador',
          });

          nuevosDocsSubidos.push(docSubido);
        }
      }

      onDocumentosSubidos(nuevosDocsSubidos);
      let mensajeExito = `¡Se subieron exitosamente ${nuevosDocsSubidos.length} folios en sus fechas correspondientes!`;
      if (duplicadosDescartados > 0) {
        mensajeExito += ` (Se detectaron ${duplicadosDescartados} archivos con días coincidentes; se conservó únicamente el primero de cada fecha).`;
      }
      showSuccessToast(mensajeExito);
      onClose();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Error durante la subida en lote de documentos');
    } finally {
      setSubiendo(false);
    }
  };

  // Slice paginado: 2 documentos por página para mantener interfaz limpia
  const inicioIndex = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const itemsPaginados = items.slice(inicioIndex, inicioIndex + ITEMS_POR_PAGINA);

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
      <div className="fixed inset-y-0 right-0 z-[10000] w-full max-w-xl bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
        {/* Header del Drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B2219]/10 flex items-center justify-center text-[#3B2219]">
              <Files size={18} strokeWidth={2.3} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Carga Múltiple de Documentos
              </h3>
              <p className="text-[10px] text-gray-500">
                Sube varios folios PDF asignándolos a diferentes fechas
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

        {/* Barra superior de configuración de cantidad de archivos */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] font-bold text-gray-700 block">
                ¿Cuántos archivos quieres subir?
              </span>
              <span className="text-[9.5px] text-gray-400">
                Selecciona rápido o escribe una cantidad personalizada
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {CANTIDADES_RAPIDAS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleAjustarCantidad(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    items.length === num
                      ? 'bg-[#3B2219] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}

              {/* Selector personalizado */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5">
                <span className="text-[10px] text-gray-500 font-medium">Cant:</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={cantidadPersonalizada}
                  onChange={(e) => {
                    setCantidadPersonalizada(e.target.value);
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                      handleAjustarCantidad(parsed);
                    }
                  }}
                  className="w-10 text-center font-bold text-xs bg-white border border-gray-200 rounded py-0.5 outline-none focus:border-[#3B2219]"
                />
              </div>


            </div>
          </div>
        </div>



        {/* Contenido con Scroll: Cards paginadas de a 2 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {subiendo && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs animate-fadeIn">
              <Loader2 size={18} className="animate-spin text-amber-700 shrink-0" />
              <div>
                <p className="font-bold">Subiendo documentos a Supabase...</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Procesando documento {progresoActual.actual} de {progresoActual.total}...
                </p>
              </div>
            </div>
          )}

          {/* Cards de documentos (mostrando 2 por página) */}
          <div className="space-y-4">
            {itemsPaginados.map((item) => {
              const globalIndex = items.findIndex((it) => it.id === item.id);
              const diasEnMes = Math.max(1, getDiasEnMes(Number(item.mes) || 1, Number(item.anio) || 2026) || 31);

              // 1. Detección de duplicado en el mismo lote
              const primerIndiceMismaFecha = items.findIndex(
                (it) => Number(it.dia) === Number(item.dia) && Number(it.mes) === Number(item.mes) && Number(it.anio) === Number(item.anio)
              );
              const esDuplicadoEnLote = primerIndiceMismaFecha !== -1 && primerIndiceMismaFecha < globalIndex;

              // 2. Detección de folio preexistente en la base de datos
              const yaExisteEnBitacora = docsValidos.some(
                (d) => Number(d.dia) === Number(item.dia) && Number(d.mes) === Number(item.mes) && Number(d.anio) === Number(item.anio)
              );

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition-all space-y-3 ${
                    item.archivo
                      ? 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
                      : 'border-gray-200 bg-gray-50/60'
                  }`}
                >
                  {/* Cabecera del Documento individual */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#3B2219] text-white text-[10px] font-bold flex items-center justify-center">
                        {globalIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        Documento #{globalIndex + 1}
                      </span>
                      {item.archivo && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> PDF Listo
                        </span>
                      )}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarItem(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Eliminar este archivo de la lista"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Alertas de Coincidencia de Fecha */}
                  {esDuplicadoEnLote && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-1.5 text-[10.5px] text-amber-800">
                      <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Día duplicado:</strong> El Día {item.dia} ya está en el <strong>Documento #{primerIndiceMismaFecha + 1}</strong>. Solo se mantendrá el primer documento de esta fecha.
                      </span>
                    </div>
                  )}

                  {!esDuplicadoEnLote && yaExisteEnBitacora && (
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/80 flex items-start gap-1.5 text-[10.5px] text-blue-800">
                      <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        El <strong>Día {item.dia}</strong> ya tiene un folio registrado en la bitácora. Al subirlo se actualizará este folio.
                      </span>
                    </div>
                  )}

                  {/* Selector de Fecha en orden: DÍA, MES, AÑO */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                        <Calendar size={12} className="text-[#3B2219]" />
                        <span>Fecha asignada para este archivo:</span>
                      </label>
                      {mesBloqueado && (
                        <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                          <Lock size={10} /> Mes bloqueado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Día: Siempre editable */}
                      <div>
                        <select
                          value={item.dia}
                          onChange={(e) =>
                            handleActualizarItem(item.id, 'dia', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                        >
                          {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              Día {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mes: Bloqueado si se abrió desde un mes específico */}
                      <div>
                        <select
                          value={item.mes}
                          disabled={mesBloqueado}
                          onChange={(e) =>
                            handleActualizarItem(item.id, 'mes', Number(e.target.value))
                          }
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold outline-none ${
                            mesBloqueado
                              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-80'
                              : 'bg-white text-gray-800 border-gray-200 focus:border-[#3B2219] cursor-pointer'
                          }`}
                        >
                          {MESES_NOMBRES.map((nombre, idx) => (
                            <option key={idx} value={idx + 1}>
                              {nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Año: Bloqueado si se abrió desde un mes específico */}
                      <div>
                        <select
                          value={item.anio}
                          disabled={mesBloqueado}
                          onChange={(e) =>
                            handleActualizarItem(item.id, 'anio', Number(e.target.value))
                          }
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold outline-none ${
                            mesBloqueado
                              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-80'
                              : 'bg-white text-gray-800 border-gray-200 focus:border-[#3B2219] cursor-pointer'
                          }`}
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

                  {/* Título del Folio */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">
                      Título o Folio:
                    </label>
                    <input
                      type="text"
                      placeholder={`Ej. Folio Día ${item.dia} - Avance de obra`}
                      value={item.titulo}
                      onChange={(e) => handleActualizarItem(item.id, 'titulo', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#3B2219]"
                    />
                  </div>

                  {/* Selector / Dropzone de PDF individual con opción de ELIMINAR EL DOCUMENTO */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      Documento PDF <span className="text-red-500">*</span>:
                    </label>

                    {item.archivo ? (
                      <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-xl gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                              {item.archivo.name}
                            </p>
                            <span className="text-[9.5px] text-gray-400">
                              Peso: {formatearBytes(item.archivo.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[10.5px] font-bold text-[#3B2219] hover:underline cursor-pointer px-2 py-1">
                            Cambiar
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelect(item.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>

                          {/* Botón para eliminar el documento agregado */}
                          <button
                            type="button"
                            onClick={() => handleQuitarArchivo(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Quitar este documento PDF"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-gray-300 hover:border-[#3B2219] rounded-xl p-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-gray-600 text-xs font-medium">
                        <UploadCloud size={16} className="text-gray-400" />
                        <span>Seleccionar PDF para el Día {item.dia}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(item.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón para agregar más items */}
          <button
            type="button"
            onClick={handleAgregarItem}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-[#3B2219] hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Agregar otro documento para diferente fecha</span>
          </button>
        </div>

        {/* Barra de Paginación (Paginación después del 2do documento) */}
        {totalPaginas > 1 && (
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-gray-600">
              Página <strong className="text-gray-900">{paginaActual}</strong> de <strong className="text-gray-900">{totalPaginas}</strong>{' '}
              <span className="text-gray-400">
                (Docs. {inicioIndex + 1} - {Math.min(items.length, inicioIndex + ITEMS_POR_PAGINA)} de {items.length})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                className="p-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                const item1 = items[(num - 1) * ITEMS_POR_PAGINA];
                const item2 = items[(num - 1) * ITEMS_POR_PAGINA + 1];
                const tieneArchivos = Boolean(item1?.archivo || item2?.archivo);

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaActual(num)}
                    className={`relative w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paginaActual === num
                        ? 'bg-[#3B2219] text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {num}
                    {tieneArchivos && paginaActual !== num && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                className="p-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer del Drawer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-600">
            <span className="font-bold text-[#3B2219]">{itemsConArchivo.length}</span> de{' '}
            <span className="font-bold">{items.length}</span> archivos listos
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={subiendo}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubirTodos}
              disabled={subiendo || itemsConArchivo.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#3B2219] hover:bg-[#2C1913] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {subiendo ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Subiendo {progresoActual.actual}/{progresoActual.total}...</span>
                </>
              ) : (
                <>
                  <Files size={14} />
                  <span>Subir {itemsConArchivo.length} Documentos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
