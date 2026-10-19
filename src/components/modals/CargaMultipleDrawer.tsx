'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { DocumentoBitacora } from '@/types/bitacora';
import { MESES_NOMBRES, getDiasEnMes } from '@/lib/mockData';
import { subirDocumentoBitacora, formatearBytes } from '@/lib/supabase/storage';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

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
  mesActual: number;
  anioActual: number;
  usuarioNombre: string;
  onDocumentosSubidos: (docs: DocumentoBitacora[]) => void;
}

const CANTIDADES_RAPIDAS = [2, 3, 5, 8, 10];

export default function CargaMultipleDrawer({
  isOpen,
  onClose,
  mesActual,
  anioActual,
  usuarioNombre,
  onDocumentosSubidos,
}: CargaMultipleDrawerProps) {
  const [items, setItems] = useState<ItemCargaMultiple[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [progresoActual, setProgresoActual] = useState({ actual: 0, total: 0 });

  // Inicializar items al abrir el drawer
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const diaHoy = hoy.getDate();
      const mesInicial = mesActual || (hoy.getMonth() + 1);
      const anioInicial = anioActual || hoy.getFullYear();

      // Crear 3 items iniciales con fechas consecutivas a partir de hoy o el inicio de mes
      const itemsIniciales: ItemCargaMultiple[] = Array.from({ length: 3 }, (_, i) => {
        const diaCalculado = Math.min(
          getDiasEnMes(mesInicial, anioInicial),
          Math.max(1, diaHoy + i)
        );
        return {
          id: `item-${Date.now()}-${i}`,
          dia: diaCalculado,
          mes: mesInicial,
          anio: anioInicial,
          titulo: '',
          descripcion: '',
          archivo: null,
        };
      });

      setItems(itemsIniciales);
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

  if (!isOpen) return null;

  // Cambiar la cantidad total de archivos a subir
  const handleAjustarCantidad = (nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const diff = nuevaCantidad - items.length;

    if (diff > 0) {
      const hoy = new Date();
      const nuevos: ItemCargaMultiple[] = Array.from({ length: diff }, (_, i) => {
        const ultimoItem = items[items.length - 1];
        const mesRef = ultimoItem ? ultimoItem.mes : mesActual || (hoy.getMonth() + 1);
        const anioRef = ultimoItem ? ultimoItem.anio : anioActual || hoy.getFullYear();
        const maxDias = getDiasEnMes(mesRef, anioRef);
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
  };

  const handleAgregarItem = () => {
    const hoy = new Date();
    const ultimoItem = items[items.length - 1];
    const mesRef = ultimoItem ? ultimoItem.mes : mesActual || (hoy.getMonth() + 1);
    const anioRef = ultimoItem ? ultimoItem.anio : anioActual || hoy.getFullYear();
    const maxDias = getDiasEnMes(mesRef, anioRef);
    const diaSiguiente = ultimoItem ? Math.min(maxDias, ultimoItem.dia + 1) : hoy.getDate();

    setItems([
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
    ]);
  };

  const handleEliminarItem = (id: string) => {
    if (items.length <= 1) {
      showErrorToast('Debes mantener al menos un documento en la lista.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleActualizarItem = (id: string, campo: keyof ItemCargaMultiple, valor: any) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [campo]: valor };
          // Si cambia mes o año, validar que el día no exceda el máximo del mes
          if (campo === 'mes' || campo === 'anio') {
            const maxDias = getDiasEnMes(
              campo === 'mes' ? valor : it.mes,
              campo === 'anio' ? valor : it.anio
            );
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

    setSubiendo(true);
    setProgresoActual({ actual: 0, total: itemsConArchivo.length });

    const nuevosDocsSubidos: DocumentoBitacora[] = [];

    try {
      for (let i = 0; i < itemsConArchivo.length; i++) {
        const item = itemsConArchivo[i];
        setProgresoActual({ actual: i + 1, total: itemsConArchivo.length });

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
      showSuccessToast(
        `¡Se subieron exitosamente ${nuevosDocsSubidos.length} documentos de bitácora en sus fechas correspondientes!`
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || 'Error durante la subida en lote de documentos');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => {
          if (!subiendo) onClose();
        }}
      />

      {/* Drawer Lateral */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
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
                Selecciona la cantidad o agrégalos individualmente
              </span>
            </div>

            <div className="flex items-center gap-1.5">
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

              <button
                type="button"
                onClick={handleAgregarItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4ECE6] text-[#3B2219] hover:bg-[#E8DCD4] text-xs font-bold transition-colors cursor-pointer ml-1"
                title="Agregar un archivo más a la lista"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>+1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content del Drawer: Lista de archivos con sus fechas individuales */}
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

          <div className="space-y-4">
            {items.map((item, index) => {
              const diasEnMes = getDiasEnMes(item.mes, item.anio);

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
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        Documento #{index + 1}
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

                  {/* Selector de Fecha en orden: DÍA, MES, AÑO */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1 mb-1">
                      <Calendar size={12} className="text-[#3B2219]" />
                      <span>Fecha asignada para este archivo:</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Día */}
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

                      {/* Mes */}
                      <div>
                        <select
                          value={item.mes}
                          onChange={(e) =>
                            handleActualizarItem(item.id, 'mes', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                        >
                          {MESES_NOMBRES.map((nombre, idx) => (
                            <option key={idx} value={idx + 1}>
                              {nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Año */}
                      <div>
                        <select
                          value={item.anio}
                          onChange={(e) =>
                            handleActualizarItem(item.id, 'anio', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
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

                  {/* Selector / Dropzone de PDF individual */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      Documento PDF <span className="text-red-500">*</span>:
                    </label>

                    {item.archivo ? (
                      <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate max-w-[240px]">
                              {item.archivo.name}
                            </p>
                            <span className="text-[9.5px] text-gray-400">
                              Peso: {formatearBytes(item.archivo.size)}
                            </span>
                          </div>
                        </div>

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

        {/* Footer del Drawer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 shrink-0">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {subiendo ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Subiendo ({progresoActual.actual}/{progresoActual.total})...</span>
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
    </>
  );
}
