'use client';

import React from 'react';
import { Trash2, X, CheckCircle, PowerOff, UserX } from 'lucide-react';

export interface AccionEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accion: 'eliminar' | 'suspender' | 'activar') => void;
  titulo?: string;
  nombreItem?: string;
  subtitulo1?: string;
  subtitulo2?: string;
  isSuspended: boolean;
  modoModal?: 'todos' | 'activar' | 'eliminar' | 'suspender';
}

export function AccionEstadoModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Acción sobre Registro',
  nombreItem = 'este registro',
  subtitulo1 = '',
  subtitulo2 = '',
  isSuspended,
  modoModal = 'todos',
}: AccionEstadoModalProps) {
  if (!isOpen) return null;

  const esModoActivar = modoModal === 'activar';
  const esModoEliminar = modoModal === 'eliminar';
  const esModoSuspender = modoModal === 'suspender';

  const tituloEfectivo = esModoActivar
    ? 'Activar Usuario'
    : esModoEliminar
    ? 'Eliminar Usuario'
    : esModoSuspender
    ? 'Desactivar Usuario'
    : titulo;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] animate-fadeIn" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[420px] -translate-x-1/2 -translate-y-1/2 font-poppins animate-fadeIn">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100">
          <div
            className={`absolute left-0 top-0 h-1 w-full ${
              esModoActivar
                ? 'bg-gradient-to-r from-orange-400 to-green-600'
                : 'bg-gradient-to-r from-red-500 to-[#3B2219]'
            }`}
          />

          <div className="mb-4 flex items-center justify-center relative">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ${
                esModoActivar
                  ? 'bg-green-50 text-green-600 ring-green-50/50'
                  : 'bg-[#F4ECE6] text-[#3B2219] ring-red-50/50'
              }`}
            >
              {esModoActivar ? (
                <CheckCircle size={22} strokeWidth={1.75} />
              ) : esModoEliminar ? (
                <Trash2 size={22} strokeWidth={1.75} />
              ) : (
                <UserX size={22} strokeWidth={1.75} />
              )}
            </div>
            <button
              onClick={onClose}
              className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <h3 className="text-base sm:text-[18px] font-bold text-gray-800 text-center">{tituloEfectivo}</h3>
          <p className="mt-2 text-sm sm:text-[12px] leading-relaxed text-gray-500 text-center">
            {esModoActivar
              ? `Confirmas reactivar el acceso para `
              : esModoEliminar
              ? `Confirmas eliminar definitivamente a `
              : `Selecciona la acción que deseas realizar para `}
            <span className="font-semibold text-gray-800">{nombreItem}</span>.
          </p>

          <div className="mt-4 sm:mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-sm sm:text-[12px] font-semibold text-gray-800">{nombreItem}</p>
            {subtitulo1 && <p className="text-xs sm:text-[10px] text-gray-500">{subtitulo1}</p>}
            {subtitulo2 && <p className="text-xs sm:text-[10px] text-gray-500">{subtitulo2}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {esModoActivar ? (
              <button
                onClick={() => onConfirm('activar')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 sm:py-2.5 text-sm sm:text-[12px] font-bold text-white transition-colors bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-xs active:scale-95"
              >
                <CheckCircle size={16} />
                <span>Activar Usuario</span>
              </button>
            ) : esModoEliminar ? (
              <button
                onClick={() => onConfirm('eliminar')}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 sm:py-2.5 text-sm sm:text-[12px] font-bold text-white transition-colors bg-[#3B2219] hover:bg-[#2A1710] cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 size={16} />
                <span>Eliminar definitivamente</span>
              </button>
            ) : !isSuspended ? (
              <button
                onClick={() => onConfirm('suspender')}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 sm:py-2.5 text-sm sm:text-[12px] font-semibold text-white transition-colors bg-[#3B2219] hover:bg-[#2A1710] cursor-pointer shadow-xs active:scale-95"
              >
                <PowerOff size={16} />
                Inactivar temporalmente
              </button>
            ) : (
              <div className="flex w-full gap-2 items-center">
                <button
                  onClick={() => onConfirm('activar')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 sm:py-2.5 text-xs sm:text-[11.5px] font-bold text-white transition-colors bg-orange-500 hover:bg-orange-600 cursor-pointer whitespace-nowrap px-3 shadow-xs active:scale-95"
                >
                  <CheckCircle size={15} />
                  <span>Activar</span>
                </button>
                <button
                  onClick={() => onConfirm('eliminar')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 sm:py-2.5 text-xs sm:text-[11.5px] font-bold text-white transition-colors bg-[#3B2219] hover:bg-[#2A1710] cursor-pointer whitespace-nowrap px-3 shadow-xs active:scale-95"
                >
                  <Trash2 size={15} />
                  <span>Eliminar definitivamente</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 py-3 sm:py-2.5 text-sm sm:text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50 mt-1 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

