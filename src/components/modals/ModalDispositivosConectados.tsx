'use client';

import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, LogOut, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { DispositivoSesion } from '@/types/usuario';
import {
  obtenerSesionesUsuario,
  cerrarSesionDispositivo,
  MAX_DISPOSITIVOS_PERMITIDOS,
} from '@/lib/services/sesiones';
import { showSuccessToast } from '@/components/ui/Toast';

interface ModalDispositivosConectadosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioCorreo: string;
  usuarioNombre?: string;
  onSesionCerrada?: () => void;
}

export default function ModalDispositivosConectados({
  isOpen,
  onClose,
  usuarioCorreo,
  usuarioNombre,
  onSesionCerrada,
}: ModalDispositivosConectadosProps) {
  const [sesiones, setSesiones] = useState<DispositivoSesion[]>([]);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null);

  const cargarSesiones = () => {
    if (!usuarioCorreo) return;
    const items = obtenerSesionesUsuario(usuarioCorreo);
    setSesiones(items);
  };

  useEffect(() => {
    if (isOpen) {
      cargarSesiones();
    }
  }, [isOpen, usuarioCorreo]);

  if (!isOpen) return null;

  const handleCerrarRemoto = (deviceId: string, nombreDispositivo: string) => {
    setCerrandoId(deviceId);
    setTimeout(() => {
      cerrarSesionDispositivo(usuarioCorreo, deviceId);
      cargarSesiones();
      setCerrandoId(null);
      showSuccessToast(`Sesión cerrada correctamente en ${nombreDispositivo}.`);
      onSesionCerrada?.();
    }, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-3 sm:p-4 pointer-events-none font-poppins">
        <div
          className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 pointer-events-auto animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4ECE6] text-[#3B2219] flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                  Dispositivos Conectados
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {usuarioNombre ? `${usuarioNombre} • ` : ''}
                  Máximo <strong>{MAX_DISPOSITIVOS_PERMITIDOS} dispositivos simultáneos</strong> permitidos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subtítulo informativo */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Sesiones activas ({sesiones.length} de {MAX_DISPOSITIVOS_PERMITIDOS}):
            </span>
            <span className="text-[10px] font-semibold text-[#3B2219] bg-[#F4ECE6] px-2 py-0.5 rounded-full">
              Límite: {MAX_DISPOSITIVOS_PERMITIDOS} equipos
            </span>
          </div>

          {/* Listado de dispositivos */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
            {sesiones.length > 0 ? (
              sesiones.map((sesion, idx) => {
                const esMovil =
                  sesion.dispositivo?.toLowerCase().includes('iphone') ||
                  sesion.dispositivo?.toLowerCase().includes('android') ||
                  sesion.dispositivo?.toLowerCase().includes('ipad');

                const fechaFormateada = sesion.fechaHora
                  ? new Date(sesion.fechaHora).toLocaleDateString([], {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recientemente';

                return (
                  <div
                    key={sesion.id || idx}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      sesion.esActual
                        ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          sesion.esActual
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {esMovil ? <Smartphone size={17} /> : <Laptop size={17} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-[12px] text-gray-900 truncate">
                            {sesion.dispositivo || `Dispositivo ${idx + 1}`}
                          </p>
                          {sesion.esActual ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Este dispositivo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-600">
                              Remoto
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Conectado: {fechaFormateada}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="shrink-0">
                      {sesion.esActual ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg select-none">
                          Sesión en uso
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCerrarRemoto(sesion.id, sesion.dispositivo)}
                          disabled={cerrandoId === sesion.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Cerrar la sesión de este otro equipo"
                        >
                          <LogOut size={12} />
                          <span>{cerrandoId === sesion.id ? 'Cerrando...' : 'Cerrar sesión'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                No hay sesiones adicionales registradas.
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[10.5px] text-gray-600 leading-relaxed space-y-1">
            <p>
              💡 <strong>Seguridad de cuentas:</strong> Tu cuenta puede permanecer abierta hasta en <strong>2 dispositivos al mismo tiempo</strong> (por ejemplo: tu computadora de oficina y tu teléfono).
            </p>
            <p className="text-gray-500 text-[10px]">
              Al pulsar <em>Cerrar sesión</em> en un dispositivo remoto, ese equipo se desconectará sin cerrar la sesión de tu equipo actual.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
