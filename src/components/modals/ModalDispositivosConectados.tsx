'use client';

import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, LogOut, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { DispositivoSesion } from '@/types/usuario';
import {
  obtenerSesionesUsuario,
  sincronizarSesionesServidor,
  cerrarSesionDispositivo,
  cerrarTodasSesionesRemotas,
  limpiarSesionesUsuario,
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
  const [cerrandoTodas, setCerrandoTodas] = useState(false);

  const cargarSesiones = async () => {
    if (!usuarioCorreo) return;
    const local = obtenerSesionesUsuario(usuarioCorreo);
    setSesiones(local);

    try {
      const servidor = await sincronizarSesionesServidor(usuarioCorreo);
      if (servidor) {
        setSesiones(servidor);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      cargarSesiones();
    }
  }, [isOpen, usuarioCorreo]);

  if (!isOpen) return null;

  const handleCerrarRemoto = async (deviceId: string, nombreDispositivo: string) => {
    setCerrandoId(deviceId);
    cerrarSesionDispositivo(usuarioCorreo, deviceId);
    showSuccessToast(`Sesión cerrada correctamente en ${nombreDispositivo}.`);
    await cargarSesiones();
    setCerrandoId(null);
    onSesionCerrada?.();
  };

  const handleCerrarTodas = async () => {
    setCerrandoTodas(true);
    limpiarSesionesUsuario(usuarioCorreo);
    try {
      await fetch(`/api/sesiones?correo=${encodeURIComponent(usuarioCorreo)}`, { method: 'DELETE' });
    } catch (_) {}
    showSuccessToast(`Todas las sesiones de ${usuarioNombre || 'usuario'} fueron finalizadas.`);
    setSesiones([]);
    setCerrandoTodas(false);
    onSesionCerrada?.();
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
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                Dispositivos Conectados
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {usuarioNombre ? `${usuarioNombre} • ` : ''}
                Máximo <strong>{MAX_DISPOSITIVOS_PERMITIDOS} dispositivos simultáneos</strong> permitidos
              </p>
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

          {/* Subtítulo informativo y botón cerrar todas */}
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Sesiones activas ({sesiones.length} de {MAX_DISPOSITIVOS_PERMITIDOS}):
            </span>
            {sesiones.length > 0 && (
              <button
                type="button"
                onClick={handleCerrarTodas}
                disabled={cerrandoTodas}
                className="text-[10.5px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cerrandoTodas ? 'Desconectando...' : 'Cerrar todas las sesiones'}
              </button>
            )}
          </div>

          {/* Listado de sesiones */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {sesiones.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                No hay sesiones activas registradas para esta cuenta.
              </div>
            ) : (
              sesiones.map((s, index) => {
                const esMovil =
                  s.dispositivo?.toLowerCase().includes('phone') ||
                  s.dispositivo?.toLowerCase().includes('android');
                const IconoDispositivo = esMovil ? Smartphone : Laptop;

                return (
                  <div
                    key={s.id || index}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      s.esActual
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          s.esActual
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <IconoDispositivo size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {s.dispositivo || 'Equipo Web'}
                          </p>
                          {s.esActual && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                              <CheckCircle2 size={10} /> Este dispositivo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {s.fechaHora ? new Date(s.fechaHora).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente'}
                          {s.ip ? ` • IP: ${s.ip}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCerrarRemoto(s.id, s.dispositivo || 'dispositivo')}
                      disabled={cerrandoId === s.id}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                      title="Cerrar la sesión de este dispositivo inmediatamente"
                    >
                      <LogOut size={12} />
                      <span>{cerrandoId === s.id ? 'Cerrando...' : 'Cerrar sesión'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Informativo */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Shield size={12} className="text-gray-400" />
              <span>Protección de acceso por cuenta</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
