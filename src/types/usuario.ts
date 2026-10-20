export type RolUsuario =
  | 'Administrador'
  | 'Gerencia'
  | 'IngenieroResidente'
  | 'Laboratorista'
  | 'AuxiliarDeCampo'
  | 'Contratante'
  | 'Supervisor'
  | 'Usuario';

export type EstadoUsuario = 'Activo' | 'Inactivo' | 'Suspendido';

export interface Usuario {
  id: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  username?: string | null;
  nombre: string;
  correo: string;
  rol: RolUsuario | string | null;
  estado: EstadoUsuario;
  fechaCreacion: string;
  ultimoAcceso?: string;
  contadorAccesos?: number;
  telefono?: string;
  cargo?: string;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  avatar?: string;
  proyectosAsignados?: string[];
  proyectos_activos_count?: number;
}

export interface DispositivoSesion {
  id: string; // deviceId
  usuarioId?: string;
  usuarioCorreo: string;
  dispositivo: string;
  fechaHora: string;
  ip?: string;
  esActual?: boolean;
}

