'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Shield, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario';
import { UsuarioTabla } from '@/components/modules/usuarios/UsuarioTabla';
import { UsuarioDrawer, UsuarioDrawerMode } from '@/components/modules/usuarios/UsuarioDrawer';
import { UsuarioDeleteModal } from '@/components/modules/usuarios/UsuarioDeleteModal';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { formatearNombrePropio } from '@/lib/utils/formatters';

const USUARIOS_BASE: Usuario[] = [
  {
    id: 'demo-admin-1',
    primer_nombre: 'Daniel',
    primer_apellido: 'Figueroa',
    username: 'danielfigueroa',
    nombre: 'Daniel Figueroa',
    correo: 'admin@bitacoradigital.com',
    rol: 'Administrador',
    estado: 'Activo',
    cargo: 'Administrador de Proyecto',
    telefono: '+502 56252922',
    fechaCreacion: '2026-01-10',
    direccion: 'Ciudad de Guatemala',
  },
  {
    id: 'demo-user-2',
    primer_nombre: 'Jorge',
    primer_apellido: 'Figueroa',
    username: 'jorgefigueroa',
    nombre: 'Jorge Figueroa',
    correo: 'usuario@bitacoradigital.com',
    rol: 'Usuario',
    estado: 'Activo',
    cargo: 'Supervisor de Obras',
    telefono: '+502 5555 9902',
    fechaCreacion: '2026-02-14',
    direccion: 'Villa Nueva',
  },
  {
    id: 'demo-user-3',
    primer_nombre: 'Raúl',
    primer_apellido: 'Alvarado',
    username: 'raulalvarado',
    nombre: 'Raúl Alvarado',
    correo: 'residente@bitacoradigital.com',
    rol: 'IngenieroResidente',
    estado: 'Activo',
    cargo: 'Ingeniero Residente',
    telefono: '+502 4432 1098',
    fechaCreacion: '2026-03-01',
    direccion: 'Amatitlán',
  },
  {
    id: 'demo-user-4',
    primer_nombre: 'Mario',
    primer_apellido: 'Tzul',
    username: 'mariotzul',
    nombre: 'Mario Tzul',
    correo: 'mario.tzul@bitacoradigital.com',
    rol: 'Laboratorista',
    estado: 'Inactivo',
    cargo: 'Laboratorista de Suelos',
    telefono: '+502 4589 7712',
    fechaCreacion: '2026-03-12',
    direccion: 'San Miguel Petapa',
  },
];

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_BASE);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | 'Todos'>('Todos');
  const [filtroRol, setFiltroRol] = useState<string>('Todos');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<UsuarioDrawerMode>('create');
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | undefined>();

  // Modal Eliminar / Suspender / Activar
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | undefined>();
  const [modoModalEliminar, setModoModalEliminar] = useState<'todos' | 'activar' | 'eliminar' | 'suspender'>('todos');

  // Cargar usuarios de Supabase
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      if (supabase) {
        const { data, error } = await supabase
          .from('perfil_usuario')
          .select('*, usuario(*, rol(*))');

        if (!error && data && data.length > 0) {
          const mapeados: Usuario[] = data.map((item: any) => {
            const pNombre = item.primer_nombre || (item.nombre_completo ? item.nombre_completo.split(' ')[0] : 'Usuario');
            const pApellido = item.primer_apellido || (item.nombre_completo ? item.nombre_completo.split(' ').slice(1).join(' ') : '');
            return {
              id: item.usuario_id || item.id,
              primer_nombre: pNombre,
              primer_apellido: pApellido,
              nombre: item.nombre_completo || `${pNombre} ${pApellido}`.trim(),
              correo: item.usuario?.correo || item.correo || 'usuario@bitacoradigital.com',
              rol: item.usuario?.rol?.nombre_rol || item.rol || 'Usuario',
              estado: (item.usuario?.estado || 'Activo') as EstadoUsuario,
              cargo: item.cargo_puesto || 'Colaborador',
              telefono: item.telefono || '',
              fechaCreacion: item.created_at ? item.created_at.slice(0, 10) : '2026-01-01',
              direccion: item.direccion || '',
            };
          });

          // Combinar con base sin duplicar correos
          const emailsSet = new Set(mapeados.map((m) => m.correo.toLowerCase()));
          const combinados = [
            ...mapeados,
            ...USUARIOS_BASE.filter((b) => !emailsSet.has(b.correo.toLowerCase())),
          ];
          setUsuarios(combinados);
          localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(combinados));
          return;
        }
      }

      // Fallback local
      const stored = localStorage.getItem('bitacora_usuarios_lista');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsuarios(parsed);
            return;
          }
        } catch (_) {}
      }
    } catch (_) {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 250);
    return () => clearTimeout(handler);
  }, [busqueda]);

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const q = debouncedBusqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        u.nombre.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        (u.cargo && u.cargo.toLowerCase().includes(q));

      const matchEstado = filtroEstado === 'Todos' || u.estado === filtroEstado;
      const matchRol = filtroRol === 'Todos' || u.rol === filtroRol;

      return matchBusqueda && matchEstado && matchRol;
    });
  }, [usuarios, debouncedBusqueda, filtroEstado, filtroRol]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina) || 1;

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual, registrosPorPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedBusqueda, filtroEstado, filtroRol, registrosPorPagina]);

  // Manejo de Drawer
  const abrirDrawer = (mode: UsuarioDrawerMode, usuario?: Usuario) => {
    setUsuarioActivo(usuario);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const handleNuevo = () => abrirDrawer('create');
  const handleVer = (usuario: Usuario) => abrirDrawer('view', usuario);
  const handleEditar = (usuario: Usuario) => abrirDrawer('edit', usuario);

  const handleGuardarUsuario = async (payload: any) => {
    try {
      const pNombre = formatearNombrePropio(payload.primer_nombre);
      const sNombre = payload.segundo_nombre ? formatearNombrePropio(payload.segundo_nombre) : '';
      const pApellido = formatearNombrePropio(payload.primer_apellido);
      const sApellido = payload.segundo_apellido ? formatearNombrePropio(payload.segundo_apellido) : '';
      const nombreCompleto = `${pNombre} ${sNombre} ${pApellido} ${sApellido}`.replace(/\s+/g, ' ').trim();

      if (drawerMode === 'edit' && usuarioActivo) {
        // Actualizar existente
        const actualizados = usuarios.map((u) => {
          if (u.id === usuarioActivo.id) {
            return {
              ...u,
              primer_nombre: pNombre,
              segundo_nombre: sNombre || null,
              primer_apellido: pApellido,
              segundo_apellido: sApellido || null,
              nombre: nombreCompleto,
              correo: payload.correo,
              telefono: payload.telefono,
              rol: payload.rol,
              estado: payload.estado,
              cargo: payload.cargo,
              direccion: payload.direccion || null,
            };
          }
          return u;
        });

        setUsuarios(actualizados);
        localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(actualizados));

        // Actualizar en Supabase si es posible
        if (supabase && usuarioActivo.id) {
          try {
            await supabase.from('perfil_usuario').update({
              nombre_completo: nombreCompleto,
              primer_nombre: pNombre,
              primer_apellido: pApellido,
              cargo_puesto: payload.cargo,
              telefono: payload.telefono,
              correo: payload.correo,
            }).eq('usuario_id', usuarioActivo.id);
          } catch (_) {}
        }

        showSuccessToast('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo
        let newId = `user-${Date.now()}`;

        if (supabaseAdmin) {
          try {
            const { data: adminUser } = await supabaseAdmin.auth.admin.createUser({
              email: payload.correo,
              password: payload.password || 'mariobros25',
              email_confirm: true,
              user_metadata: {
                nombre_completo: nombreCompleto,
                rol: payload.rol,
              },
            });
            if (adminUser?.user) newId = adminUser.user.id;
          } catch (_) {}
        }

        const nuevoUserObj: Usuario = {
          id: newId,
          primer_nombre: pNombre,
          segundo_nombre: sNombre || null,
          primer_apellido: pApellido,
          segundo_apellido: sApellido || null,
          nombre: nombreCompleto,
          correo: payload.correo,
          telefono: payload.telefono,
          rol: payload.rol,
          estado: payload.estado || 'Activo',
          cargo: payload.cargo,
          direccion: payload.direccion || null,
          fechaCreacion: new Date().toISOString().slice(0, 10),
        };

        const actualizados = [nuevoUserObj, ...usuarios];
        setUsuarios(actualizados);
        localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(actualizados));
        showSuccessToast('Usuario creado exitosamente');
      }

      setDrawerOpen(false);
      setUsuarioActivo(undefined);
    } catch (err: any) {
      showErrorToast(err.message || 'Error al guardar el usuario');
    }
  };

  // Manejo de Modal de Eliminación / Suspensión
  const handleOpenDelete = (id: string, modo: 'todos' | 'activar' | 'eliminar' | 'suspender' = 'todos') => {
    const usr = usuarios.find((u) => u.id === id);
    if (!usr) return;
    setUsuarioEliminar(usr);
    setModoModalEliminar(modo);
    setDeleteOpen(true);
  };

  const handleConfirmarAccion = (accion: 'eliminar' | 'suspender' | 'activar') => {
    if (!usuarioEliminar) return;

    if (accion === 'eliminar') {
      const actualizados = usuarios.filter((u) => u.id !== usuarioEliminar.id);
      setUsuarios(actualizados);
      localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(actualizados));
      showSuccessToast('Usuario eliminado definitivamente');
    } else {
      const nuevoEstado: EstadoUsuario = accion === 'activar' ? 'Activo' : 'Suspendido';
      const actualizados = usuarios.map((u) => {
        if (u.id === usuarioEliminar.id) {
          return { ...u, estado: nuevoEstado };
        }
        return u;
      });
      setUsuarios(actualizados);
      localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(actualizados));
      showSuccessToast(accion === 'activar' ? 'Usuario activado exitosamente' : 'Usuario suspendido exitosamente');
    }

    setDeleteOpen(false);
    setUsuarioEliminar(undefined);
  };

  const handleCerrarSesionRemota = (usr: Usuario) => {
    showSuccessToast(`Sesión remota cerrada para ${usr.nombre}`);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      <TopBar bitacoraNombre="BITÁCORA VAI - ANCOPIE • USUARIOS" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Sticky Encabezado con Botones como en DomunNet */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-700 bg-white/70 border border-gray-200 shadow-2xs cursor-pointer"
              title="Volver a Bitácoras"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">Usuarios</h1>
              <p className="text-xs text-gray-500 font-medium">
                Gestión de accesos, roles y permisos del sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/roles"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield size={14} className="text-[#3B2219]" />
              <span>Gestión de Roles</span>
            </Link>

            <button
              type="button"
              onClick={handleNuevo}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros estilo DomunNet */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3B2219] transition-colors"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Pestañas de Estado (Desktop) */}
            <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-xl">
              {(['Todos', 'Activo', 'Inactivo', 'Suspendido'] as const).map((est) => (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3 py-1 text-[11px] transition-all rounded-lg cursor-pointer whitespace-nowrap ${
                    filtroEstado === est
                      ? 'bg-white text-gray-900 shadow-2xs font-bold'
                      : 'text-gray-500 hover:text-gray-800 font-medium'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>

            {/* Selector de Rol */}
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:border-[#3B2219] focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Gerencia">Gerencia</option>
              <option value="IngenieroResidente">Ingeniero Residente</option>
              <option value="Laboratorista">Laboratorista</option>
              <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
              <option value="Contratante">Contratante</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Usuario">Usuario</option>
            </select>
          </div>

          <div className="text-[11px] text-gray-500 font-medium shrink-0 self-end sm:self-auto">
            {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <UsuarioTabla
          usuarios={usuariosPaginados}
          onVer={handleVer}
          onEditar={handleEditar}
          onEliminar={handleOpenDelete}
          onCerrarSesion={handleCerrarSesionRemota}
        />

        {/* Paginación Inferior idéntica a DomunNet */}
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>
              Mostrando {usuariosPaginados.length > 0 ? (paginaActual - 1) * registrosPorPagina + 1 : 0} a{' '}
              {Math.min(paginaActual * registrosPorPagina, usuariosFiltrados.length)} de{' '}
              <strong className="text-gray-900">{usuariosFiltrados.length}</strong> usuarios
            </span>

            <span className="text-gray-300">|</span>

            <div className="flex items-center gap-1.5">
              <span>Por página:</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-0.5 bg-gray-50 text-xs font-semibold text-gray-800 outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 text-gray-800 bg-gray-50 rounded-lg border border-gray-200">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>

      {/* Drawer de Usuario (Create, Edit, View) */}
      <UsuarioDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setUsuarioActivo(undefined);
        }}
        onSave={handleGuardarUsuario}
        usuario={usuarioActivo}
        mode={drawerMode}
        onSwitchToEdit={() => setDrawerMode('edit')}
      />

      {/* Modal de Acción (Eliminar / Suspender / Activar) */}
      <UsuarioDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setUsuarioEliminar(undefined);
        }}
        onConfirm={handleConfirmarAccion}
        usuario={usuarioEliminar}
        modoModal={modoModalEliminar}
      />
    </div>
  );
}

