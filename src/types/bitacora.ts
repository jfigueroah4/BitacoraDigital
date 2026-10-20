export type UserRole = 'Administrador' | 'Usuario';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  username?: string;
  rol: UserRole;
  cargo?: string;
}

export interface DocumentoBitacora {
  id: string;
  dia: number;
  mes: number; // 1-12
  anio: number;
  fecha: string; // YYYY-MM-DD
  titulo: string;
  descripcion?: string;
  nombreArchivo: string;
  urlPdf: string;
  pesoBytes: number;
  pesoFormateado: string;
  subidoPor: string;
  subidoPorRol?: string;
  fechaSubida: string;
  estado?: 'aprobado' | 'pendiente' | 'en_revision';
}

export interface MesInfo {
  mes: number; // 1-12
  anio: number;
  nombre: string; // e.g. "Octubre 2026"
  nombreMes: string; // e.g. "Octubre"
  totalDias: number;
  diasConDocumentos: number;
  documentos: DocumentoBitacora[];
}
