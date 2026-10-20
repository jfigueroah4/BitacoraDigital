import { DispositivoSesion } from '@/types/usuario';

const STORAGE_KEY_SESIONES = 'bitacora_sesiones_activas';
const STORAGE_KEY_DEVICE_ID = 'bitacora_device_id';
export const MAX_DISPOSITIVOS_PERMITIDOS = 2;

/**
 * Obtiene o crea un ID único y persistente para este navegador/dispositivo
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_ssr';
  try {
    let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
    }
    return id;
  } catch (_) {
    return 'dev_fallback_' + Date.now();
  }
}

/**
 * Detecta el sistema operativo y navegador del cliente actual (igual que en DomunNet)
 */
export function detectarDispositivoCliente(): string {
  if (typeof window === 'undefined') return 'Navegador Web';
  const ua = navigator.userAgent.toLowerCase();
  let so = 'Dispositivo';
  if (ua.includes('iphone')) so = 'iPhone';
  else if (ua.includes('ipad')) so = 'iPad';
  else if (ua.includes('android')) so = 'Android';
  else if (ua.includes('windows nt 10.0') || ua.includes('windows')) so = 'Windows PC';
  else if (ua.includes('macintosh') || ua.includes('mac os')) so = 'Mac';
  else if (ua.includes('linux')) so = 'Linux';

  let nav = 'Navegador';
  if (ua.includes('edg/')) nav = 'Edge';
  else if (ua.includes('chrome/')) nav = 'Chrome';
  else if (ua.includes('firefox/')) nav = 'Firefox';
  else if (ua.includes('safari/')) nav = 'Safari';

  return `${so} (${nav})`;
}

/**
 * Obtiene todas las sesiones activas en el sistema desde localStorage
 */
function getTodasLasSesiones(): DispositivoSesion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESIONES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

/**
 * Guarda el listado global de sesiones activas en localStorage
 */
function guardarTodasLasSesiones(sesiones: DispositivoSesion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SESIONES, JSON.stringify(sesiones));
  } catch (_) {}
}

/**
 * Obtiene las sesiones activas para un usuario específico indicando cuál es la actual
 */
export function obtenerSesionesUsuario(correo: string): DispositivoSesion[] {
  if (!correo) return [];
  const correoLower = correo.trim().toLowerCase();
  const currentDeviceId = getOrCreateDeviceId();
  const todas = getTodasLasSesiones();

  const usuarioSesiones = todas.filter(
    (s) => s.usuarioCorreo && s.usuarioCorreo.toLowerCase() === correoLower
  );

  return usuarioSesiones.map((s) => ({
    ...s,
    esActual: s.id === currentDeviceId,
  }));
}

/**
 * Obtiene las sesiones activas sincronizadas con el servidor
 */
export async function sincronizarSesionesServidor(correo?: string): Promise<DispositivoSesion[]> {
  try {
    const url = correo ? `/api/sesiones?correo=${encodeURIComponent(correo)}` : '/api/sesiones';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.sesiones)) {
        if (!correo) {
          guardarTodasLasSesiones(data.sesiones);
        }
        const currentDeviceId = getOrCreateDeviceId();
        return data.sesiones.map((s: any) => ({
          ...s,
          esActual: s.id === currentDeviceId,
        }));
      }
    }
  } catch (_) {}
  return correo ? obtenerSesionesUsuario(correo) : getTodasLasSesiones();
}

/**
 * Registra o renueva la sesión del dispositivo actual para el usuario logueado
 */
export function registrarSesionDispositivo(usuario: {
  id: string;
  email: string;
  nombre?: string;
}): { success: boolean; sesiones: DispositivoSesion[]; limiteAlcanzado?: boolean } {
  const correoLower = (usuario.email || '').trim().toLowerCase();
  const currentDeviceId = getOrCreateDeviceId();
  const dispositivoNombre = detectarDispositivoCliente();
  const todas = getTodasLasSesiones();

  const otrasDeEsteUsuario = todas.filter(
    (s) => s.usuarioCorreo && s.usuarioCorreo.toLowerCase() === correoLower
  );

  const yaExisteEnEsteDispositivo = otrasDeEsteUsuario.some((s) => s.id === currentDeviceId);

  if (!yaExisteEnEsteDispositivo && otrasDeEsteUsuario.length >= MAX_DISPOSITIVOS_PERMITIDOS) {
    return {
      success: false,
      limiteAlcanzado: true,
      sesiones: otrasDeEsteUsuario.map((s) => ({
        ...s,
        esActual: false,
      })),
    };
  }

  const sesionActual: DispositivoSesion = {
    id: currentDeviceId,
    usuarioId: usuario.id,
    usuarioCorreo: correoLower,
    dispositivo: dispositivoNombre,
    fechaHora: new Date().toISOString(),
    ip: 'Red Local / Internet',
    esActual: true,
  };

  const filtradas = todas.filter(
    (s) => !(s.usuarioCorreo?.toLowerCase() === correoLower && s.id === currentDeviceId)
  );

  const remotasDelUsuario = filtradas.filter(
    (s) => s.usuarioCorreo?.toLowerCase() === correoLower
  );
  let remotasAceptadas = remotasDelUsuario;
  if (remotasDelUsuario.length >= MAX_DISPOSITIVOS_PERMITIDOS) {
    remotasAceptadas = remotasDelUsuario.slice(-1);
  }

  const sinEsteUsuario = filtradas.filter(
    (s) => s.usuarioCorreo?.toLowerCase() !== correoLower
  );

  const nuevasSesiones = [...sinEsteUsuario, ...remotasAceptadas, sesionActual];
  guardarTodasLasSesiones(nuevasSesiones);

  // Sincronizar en background con API del servidor
  try {
    fetch('/api/sesiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentDeviceId,
        usuarioCorreo: correoLower,
        usuarioNombre: usuario.nombre || 'Usuario',
        dispositivo: dispositivoNombre,
      }),
    }).catch(() => {});
  } catch (_) {}

  return {
    success: true,
    sesiones: [...remotasAceptadas, sesionActual].map((s) => ({
      ...s,
      esActual: s.id === currentDeviceId,
    })),
  };
}

/**
 * Cierra la sesión de un dispositivo remoto específico sin afectar el actual
 */
export function cerrarSesionDispositivo(correo: string, deviceIdACerrar: string): void {
  const correoLower = (correo || '').trim().toLowerCase();
  const todas = getTodasLasSesiones();

  const actualizadas = todas.filter(
    (s) => !(s.usuarioCorreo?.toLowerCase() === correoLower && s.id === deviceIdACerrar)
  );

  guardarTodasLasSesiones(actualizadas);

  try {
    fetch(`/api/sesiones?id=${encodeURIComponent(deviceIdACerrar)}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
}

/**
 * Cierra todas las sesiones remotas de un usuario (conservando solo la actual si se indica)
 */
export function cerrarTodasSesionesRemotas(correo: string, conservarActual: boolean = true): void {
  const correoLower = (correo || '').trim().toLowerCase();
  const currentDeviceId = getOrCreateDeviceId();
  const todas = getTodasLasSesiones();

  const actualizadas = todas.filter((s) => {
    if (s.usuarioCorreo?.toLowerCase() !== correoLower) return true;
    if (conservarActual && s.id === currentDeviceId) return true;
    return false;
  });

  guardarTodasLasSesiones(actualizadas);

  try {
    fetch(`/api/sesiones?correo=${encodeURIComponent(correoLower)}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
}

/**
 * Elimina todas las sesiones activas de un usuario (al suspender o eliminar cuenta)
 */
export function limpiarSesionesUsuario(correo: string): void {
  if (!correo) return;
  const correoLower = correo.trim().toLowerCase();
  const todas = getTodasLasSesiones();
  const actualizadas = todas.filter(
    (s) => s.usuarioCorreo?.toLowerCase() !== correoLower
  );
  guardarTodasLasSesiones(actualizadas);

  try {
    fetch(`/api/sesiones?correo=${encodeURIComponent(correoLower)}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}
}

/**
 * Verifica si este dispositivo aún tiene sesión válida activa
 */
export function esSesionDispositivoValida(correo: string): boolean {
  if (!correo) return false;
  const currentDeviceId = getOrCreateDeviceId();
  const sesiones = obtenerSesionesUsuario(correo);
  return sesiones.some((s) => s.id === currentDeviceId);
}


export async function obtenerTodasLasSesionesServidor(): Promise<DispositivoSesion[]> {
  try {
    const res = await fetch(`/api/sesiones?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.sesiones)) {
        return data.sesiones;
      }
    }
  } catch (_) {}
  return [];
}
