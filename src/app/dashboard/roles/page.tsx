'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Plus,
  Search,
  CheckCircle,
  Trash2,
  Edit2,
  Eye,
  X,
  Lock,
  Check,
  Users,
  PencilLine,
  UserPlus,
  Filter,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { Usuario } from '@/types/usuario';

export interface RolItem {
  id: string;
  name: string;
  email: string;
  descripcion: string;
  color: string;
  estado: 'Activo' | 'Inactivo';
  nivelJerarquico?: string;
  permisos: string[];
  usuariosAsignados: string[]; // User IDs or emails
}

const PRESET_COLORS = [
  '#3B2219', // Domun Wine
  '#1E40AF', // Blue
  '#047857', // Emerald
  '#B45309', // Amber
  '#6D28D9', // Purple
  '#0E7490', // Cyan
  '#BE185D', // Pink
  '#374151', // Dark Gray
];

const CATALOGO_PERMISOS = [
  {
    categoria: 'Módulo de Bitácora y Documentos PDF',
    items: [
      { id: 'bitacora.ver', label: 'Consultar Bitácoras y Visor de PDF' },
      { id: 'bitacora.crear', label: 'Crear Registros y Folios Diarios' },
      { id: 'bitacora.subir_pdf', label: 'Subir Documentos PDF a Bucket de Supabase' },
      { id: 'bitacora.aprobar', label: 'Aprobar y Firmar Notas de Bitácora' },
      { id: 'bitacora.eliminar', label: 'Eliminar Documentos y Registros' },
    ],
  },
  {
    categoria: 'Módulo de Usuarios y Seguridad',
    items: [
      { id: 'usuarios.ver', label: 'Ver Listado de Usuarios' },
      { id: 'usuarios.crear', label: 'Crear Nuevos Usuarios' },
      { id: 'usuarios.editar', label: 'Editar Datos y Contraseñas de Usuarios' },
      { id: 'usuarios.eliminar', label: 'Suspender y Eliminar Usuarios' },
      { id: 'roles.gestionar', label: 'Gestionar Roles y Permisos del Sistema' },
    ],
  },
  {
    categoria: 'Módulo de Reportes e Informes',
    items: [
      { id: 'reportes.ver', label: 'Acceso a Estadísticas y Dashboard' },
      { id: 'reportes.exportar', label: 'Exportar Informes en PDF y Excel' },
      { id: 'reportes.avanzados', label: 'Generar Reportes Técnicos de Campo' },
    ],
  },
  {
    categoria: 'Módulo de Tickets y Soporte',
    items: [
      { id: 'tickets.ver', label: 'Ver Solicitudes y Tickets de Soporte' },
      { id: 'tickets.responder', label: 'Responder y Gestionar Tickets' },
      { id: 'tickets.despachar_claves', label: 'Despachar Contraseñas Temporales' },
    ],
  },
];

const ROLES_BASE: RolItem[] = [
  {
    id: 'rol-admin',
    name: 'Administrador',
    email: 'admin@bitacoradigital.com',
    descripcion: 'Control total del sistema: gestión de folios, subida de PDF, usuarios y seguridad.',
    color: '#3B2219',
    estado: 'Activo',
    nivelJerarquico: 'Alta Gerencia',
    permisos: ['*.*', 'bitacora.ver', 'bitacora.crear', 'bitacora.subir_pdf', 'bitacora.aprobar', 'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'roles.gestionar', 'reportes.ver', 'reportes.exportar', 'tickets.ver', 'tickets.responder', 'tickets.despachar_claves'],
    usuariosAsignados: ['admin@bitacoradigital.com'],
  },
  {
    id: 'rol-gerencia',
    name: 'Gerencia',
    email: 'gerencia@bitacoradigital.com',
    descripcion: 'Supervisión ejecutiva, auditoría de bitácoras de obra y aprobación de reportes.',
    color: '#1E40AF',
    estado: 'Activo',
    nivelJerarquico: 'Alta Gerencia',
    permisos: ['bitacora.ver', 'bitacora.aprobar', 'reportes.ver', 'reportes.exportar', 'usuarios.ver', 'tickets.ver'],
    usuariosAsignados: [],
  },
  {
    id: 'rol-residente',
    name: 'Ingeniero Residente',
    email: 'residente@bitacoradigital.com',
    descripcion: 'Control técnico de obra en campo, subida de evidencias diarias y folios PDF.',
    color: '#047857',
    estado: 'Activo',
    nivelJerarquico: 'Mando Medio',
    permisos: ['bitacora.ver', 'bitacora.crear', 'bitacora.subir_pdf', 'reportes.ver', 'reportes.exportar'],
    usuariosAsignados: ['residente@bitacoradigital.com'],
  },
  {
    id: 'rol-laboratorio',
    name: 'Laboratorista',
    email: 'laboratorio@bitacoradigital.com',
    descripcion: 'Registro de ensayos de densidades, rotura de cilindros y control de materiales.',
    color: '#B45309',
    estado: 'Activo',
    nivelJerarquico: 'Operativo',
    permisos: ['bitacora.ver', 'bitacora.crear'],
    usuariosAsignados: ['mario.tzul@bitacoradigital.com'],
  },
  {
    id: 'rol-usuario',
    name: 'Usuario',
    email: 'usuario@bitacoradigital.com',
    descripcion: 'Consulta general de meses, días y visualización de documentos PDF.',
    color: '#6D28D9',
    estado: 'Activo',
    nivelJerarquico: 'Operativo',
    permisos: ['bitacora.ver'],
    usuariosAsignados: ['usuario@bitacoradigital.com'],
  },
];

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RolItem[]>(ROLES_BASE);
  const [usuariosSistema, setUsuariosSistema] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 5;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | 'users'>('create');
  const [rolActivo, setRolActivo] = useState<RolItem | null>(null);

  // Form states inside Drawer
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#3B2219');
  const [formEstado, setFormEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [formNivel, setFormNivel] = useState('Operativo');
  const [formPermisos, setFormPermisos] = useState<string[]>([]);
  const [formUsuariosAsignados, setFormUsuariosAsignados] = useState<string[]>([]);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rolEliminar, setRolEliminar] = useState<RolItem | null>(null);

  useEffect(() => {
    try {
      const storedRoles = localStorage.getItem('bitacora_roles_v2');
      if (storedRoles) {
        const parsed = JSON.parse(storedRoles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoles(parsed);
        }
      }
    } catch (_) {}

    try {
      const storedUsers = localStorage.getItem('bitacora_usuarios_lista');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsuariosSistema(parsed);
          return;
        }
      }
    } catch (_) {}
  }, []);

  const saveRoles = (nuevos: RolItem[]) => {
    setRoles(nuevos);
    try {
      localStorage.setItem('bitacora_roles_v2', JSON.stringify(nuevos));
    } catch (_) {}
  };

  const abrirDrawer = (mode: 'create' | 'edit' | 'view' | 'users', rol?: RolItem) => {
    setDrawerMode(mode);
    if (rol) {
      setRolActivo(rol);
      setFormName(rol.name);
      setFormDesc(rol.descripcion);
      setFormColor(rol.color || '#3B2219');
      setFormEstado(rol.estado);
      setFormNivel(rol.nivelJerarquico || 'Operativo');
      setFormPermisos(rol.permisos || []);
      setFormUsuariosAsignados(rol.usuariosAsignados || []);
    } else {
      setRolActivo(null);
      setFormName('');
      setFormDesc('');
      setFormColor('#3B2219');
      setFormEstado('Activo');
      setFormNivel('Operativo');
      setFormPermisos(['bitacora.ver']);
      setFormUsuariosAsignados([]);
    }
    setDrawerOpen(true);
  };

  const cerrarDrawer = () => {
    setDrawerOpen(false);
    setRolActivo(null);
  };

  const handleTogglePermiso = (id: string) => {
    if (drawerMode === 'view' || drawerMode === 'users') return;
    setFormPermisos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAllPermisos = () => {
    const todos = CATALOGO_PERMISOS.flatMap((c) => c.items.map((i) => i.id));
    setFormPermisos(todos);
  };

  const handleDeselectAllPermisos = () => {
    setFormPermisos([]);
  };

  const handleToggleUsuarioAsignado = (correoOUsuario: string) => {
    setFormUsuariosAsignados((prev) =>
      prev.includes(correoOUsuario)
        ? prev.filter((u) => u !== correoOUsuario)
        : [...prev, correoOUsuario]
    );
  };

  const handleSaveRol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showErrorToast('Por favor ingresa un nombre para el rol.');
      return;
    }

    if (drawerMode === 'edit' && rolActivo) {
      const actualizados = roles.map((r) => {
        if (r.id === rolActivo.id) {
          return {
            ...r,
            name: formName.trim(),
            descripcion: formDesc.trim(),
            color: formColor,
            estado: formEstado,
            nivelJerarquico: formNivel,
            permisos: formPermisos,
            usuariosAsignados: formUsuariosAsignados,
          };
        }
        return r;
      });
      saveRoles(actualizados);
      showSuccessToast('Rol actualizado exitosamente');
    } else if (drawerMode === 'users' && rolActivo) {
      const actualizados = roles.map((r) => {
        if (r.id === rolActivo.id) {
          return {
            ...r,
            usuariosAsignados: formUsuariosAsignados,
          };
        }
        return r;
      });
      saveRoles(actualizados);
      showSuccessToast('Usuarios asignados correctamente al rol');
    } else {
      const nuevo: RolItem = {
        id: `rol-${Date.now()}`,
        name: formName.trim(),
        email: `${formName.toLowerCase().replace(/\s+/g, '')}@bitacoradigital.com`,
        descripcion: formDesc.trim(),
        color: formColor,
        estado: formEstado,
        nivelJerarquico: formNivel,
        permisos: formPermisos,
        usuariosAsignados: formUsuariosAsignados,
      };
      saveRoles([nuevo, ...roles]);
      showSuccessToast('Nuevo rol creado exitosamente');
    }

    cerrarDrawer();
  };

  const handleConfirmDelete = () => {
    if (!rolEliminar) return;
    if (rolEliminar.name === 'Administrador') {
      showErrorToast('No se puede eliminar el rol de Administrador.');
      setDeleteModalOpen(false);
      return;
    }
    const filtrados = roles.filter((r) => r.id !== rolEliminar.id);
    saveRoles(filtrados);
    showSuccessToast(`Rol "${rolEliminar.name}" eliminado correctamente`);
    setDeleteModalOpen(false);
    setRolEliminar(null);
  };

  // Filtrado de roles
  const rolesFiltrados = useMemo(() => {
    return roles.filter((r) => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q);

      const matchEstado = filtroEstado === 'Todos' || r.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }, [roles, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(rolesFiltrados.length / registrosPorPagina) || 1;
  const rolesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return rolesFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [rolesFiltrados, paginaActual, registrosPorPagina]);

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      <TopBar bitacoraNombre="Proyecto: Conexion VAS - Hincapie • GESTIÓN DE ROLES" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Header con botón volver a usuarios y agregar rol */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/usuarios')}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-700 bg-white/70 border border-gray-200 shadow-2xs cursor-pointer"
              title="Volver a Usuarios"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                Roles y Permisos
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Gestión de niveles de acceso, perfiles de seguridad y asignación de usuarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/usuarios"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Volver a Usuarios</span>
            </Link>
            <button
              type="button"
              onClick={() => abrirDrawer('create')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Agregar Rol</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros con Search y Tabs de Estado */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar rol por nombre o permiso..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#3B2219] transition-colors"
              />
            </div>

            {/* Controles Estado Desktop */}
            <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-xl">
              {(['Todos', 'Activo', 'Inactivo'] as const).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => {
                    setFiltroEstado(estado);
                    setPaginaActual(1);
                  }}
                  className={`px-3 py-1 text-[11px] transition-colors rounded-lg cursor-pointer whitespace-nowrap ${
                    filtroEstado === estado
                      ? 'bg-white text-gray-800 shadow-2xs font-bold'
                      : 'text-gray-500 hover:text-gray-700 font-medium'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 font-medium mr-1 shrink-0">
            {rolesFiltrados.length} rol{rolesFiltrados.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* VISTA MOBILE: Tarjetas de Roles accesibles y legibles */}
        <div className="md:hidden space-y-3">
          {rolesPaginados.map((rol) => {
            const isFullAdmin = rol.name === 'Administrador' || rol.permisos.includes('*.*');
            return (
              <div
                key={`mob-${rol.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: rol.color }}
                    >
                      <Shield size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{rol.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{rol.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      rol.estado === 'Inactivo'
                        ? 'bg-[#F4ECE6] text-red-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {rol.estado}
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">{rol.descripcion}</p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => abrirDrawer('users', rol)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-700 cursor-pointer shadow-2xs hover:bg-gray-50"
                  >
                    <Users size={12} className="text-[#3B2219]" />
                    <span>{rol.usuariosAsignados.length} usuarios</span>
                  </button>

                  {isFullAdmin ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4ECE6] text-[#3B2219]">
                      Acceso completo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700">
                      {rol.permisos.length} permisos
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => abrirDrawer('view', rol)}
                    className="p-1 text-gray-400 hover:text-[#3B2219] cursor-pointer"
                    title="Ver detalle"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirDrawer('edit', rol)}
                    className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                    title="Editar rol"
                  >
                    <PencilLine size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirDrawer('users', rol)}
                    className="p-1 text-gray-400 hover:text-emerald-600 cursor-pointer"
                    title="Asignar usuarios"
                  >
                    <UserPlus size={14} />
                  </button>
                  {rol.name !== 'Administrador' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRolEliminar(rol);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Eliminar rol"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* VISTA DESKTOP: Tabla de Roles idéntica a DomunNet */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Usuarios Asignados</th>
                  <th className="px-4 py-3">Permisos</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rolesPaginados.map((rol) => {
                  const isFullAdmin =
                    rol.name === 'Administrador' || rol.permisos.includes('*.*');
                  return (
                    <tr
                      key={rol.id}
                      className="hover:bg-gray-50/80 border-t border-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: rol.color }}
                          >
                            <Shield size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 leading-tight">
                              {rol.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{rol.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-[11px] text-gray-600 truncate">{rol.descripcion}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            rol.estado === 'Inactivo'
                              ? 'bg-[#F4ECE6] text-red-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {rol.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => abrirDrawer('users', rol)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                          title="Ver y asignar usuarios a este rol"
                        >
                          <Users size={12} className="text-[#3B2219]" />
                          <span>{rol.usuariosAsignados.length} usuarios</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {isFullAdmin ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F4ECE6] text-[#3B2219]">
                              Acceso completo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700">
                              {rol.permisos.length} facultades
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirDrawer('view', rol)}
                            className="p-1 text-gray-400 hover:text-[#3B2219] transition-colors cursor-pointer"
                            title="Ver detalle del rol"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirDrawer('edit', rol)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Editar rol"
                          >
                            <PencilLine size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirDrawer('users', rol)}
                            className="p-1 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Asignar usuarios"
                          >
                            <UserPlus size={14} />
                          </button>
                          {rol.name !== 'Administrador' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRolEliminar(rol);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar rol"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-2xs text-xs text-gray-600">
            <span>
              Página {paginaActual} de {totalPaginas}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>

      {/* RoleDrawer Slide-over (Idéntico a DomunNet) */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={cerrarDrawer}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: formColor }}
                >
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {drawerMode === 'create'
                      ? 'Crear Nuevo Rol'
                      : drawerMode === 'edit'
                      ? `Editar Rol: ${formName}`
                      : drawerMode === 'users'
                      ? `Usuarios Asignados: ${formName}`
                      : `Detalles del Rol: ${formName}`}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {drawerMode === 'users'
                      ? 'Selecciona los usuarios que tendrán este rol en el sistema'
                      : 'Configuración de permisos y facultades del perfil'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarDrawer}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {drawerMode === 'users' ? (
                /* MODO ASIGNACIÓN DE USUARIOS */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700">Usuarios del Sistema</span>
                    <span className="text-[11px] text-[#3B2219] font-semibold">
                      {formUsuariosAsignados.length} asignados
                    </span>
                  </div>

                  <div className="space-y-2">
                    {usuariosSistema.map((user) => {
                      const isAssigned = formUsuariosAsignados.includes(user.correo);
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUsuarioAsignado(user.correo)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isAssigned
                              ? 'border-[#3B2219]/30 bg-[#F4ECE6]/40'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                              {(user.primer_nombre?.[0] || 'U') + (user.primer_apellido?.[0] || '')}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 leading-tight">
                                {user.nombre || `${user.primer_nombre} ${user.primer_apellido}`}
                              </p>
                              <p className="text-[10px] text-gray-500">{user.correo}</p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isAssigned
                                ? 'bg-[#3B2219] border-[#3B2219] text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isAssigned && <Check size={13} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* FORMULARIO NORMAL O MODO VIEW */
                <form id="role-drawer-form" onSubmit={handleSaveRol} className="space-y-4">
                  {/* Nombre del Rol */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Nombre del Rol <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Supervisor de Obras VAI"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      disabled={drawerMode === 'view'}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219] disabled:bg-gray-100/60"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Descripción del Perfil
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe las facultades y alcance de este rol..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      disabled={drawerMode === 'view'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219] disabled:bg-gray-100/60 resize-none"
                    />
                  </div>

                  {/* Selector de Color y Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Color Distintivo
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => drawerMode !== 'view' && setFormColor(col)}
                            style={{ backgroundColor: col }}
                            className={`w-6 h-6 rounded-lg transition-transform cursor-pointer ${
                              formColor === col ? 'scale-120 ring-2 ring-offset-1 ring-gray-600' : 'opacity-85'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Estado
                      </label>
                      <select
                        value={formEstado}
                        onChange={(e) => setFormEstado(e.target.value as any)}
                        disabled={drawerMode === 'view'}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219] disabled:bg-gray-100/60 cursor-pointer"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  {/* Checklist de Permisos Categorizados */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[11px] font-bold text-gray-700">
                        Permisos y Facultades del Sistema
                      </label>
                      {drawerMode !== 'view' && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={handleSelectAllPermisos}
                            className="text-[#3B2219] font-semibold hover:underline"
                          >
                            Marcar todos
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={handleDeselectAllPermisos}
                            className="text-gray-500 font-semibold hover:underline"
                          >
                            Desmarcar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {CATALOGO_PERMISOS.map((cat, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
                        >
                          <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">
                            {cat.categoria}
                          </h4>
                          <div className="space-y-1">
                            {cat.items.map((perm) => {
                              const isChecked = formPermisos.includes(perm.id) || formPermisos.includes('*.*');
                              return (
                                <div
                                  key={perm.id}
                                  onClick={() => handleTogglePermiso(perm.id)}
                                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                                    isChecked
                                      ? 'bg-[#F4ECE6]/70 border border-red-200 text-[#3B2219] font-medium'
                                      : 'hover:bg-white text-gray-700'
                                  } ${drawerMode === 'view' ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <span>{perm.label}</span>
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                      isChecked
                                        ? 'bg-[#3B2219] border-[#3B2219] text-white'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                  >
                                    {isChecked && <Check size={12} strokeWidth={3} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={cerrarDrawer}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {drawerMode === 'view' ? 'Cerrar' : 'Cancelar'}
              </button>

              {drawerMode !== 'view' && (
                <button
                  type={drawerMode === 'users' ? 'button' : 'submit'}
                  form={drawerMode === 'users' ? undefined : 'role-drawer-form'}
                  onClick={drawerMode === 'users' ? handleSaveRol : undefined}
                  className="px-5 py-2 rounded-xl bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {drawerMode === 'users' ? 'Guardar Asignaciones' : 'Guardar Rol'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteModalOpen && rolEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn font-poppins">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#F4ECE6] text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-gray-900">¿Eliminar este Rol?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Estás a punto de eliminar el rol <strong className="text-gray-800">{rolEliminar.name}</strong>. Esta acción desvinculará a los usuarios asignados.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

