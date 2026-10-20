'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Edit2, Eye, UserX, LogOut, CheckCircle, Laptop, Smartphone } from 'lucide-react';
import { Usuario, EstadoUsuario } from '@/types/usuario';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import { formatearNombrePropio } from '@/lib/utils/formatters';
import { obtenerSesionesUsuario } from '@/lib/services/sesiones';

interface UsuarioTablaProps {
  usuarios: Usuario[];
  onVer: (usuario: Usuario) => void;
  onEditar: (usuario: Usuario) => void;
  onEliminar: (id: string, modoModal?: 'todos' | 'activar' | 'eliminar' | 'suspender') => void;
  onGestionarDispositivos?: (usuario: Usuario) => void;
  currentUserEmail?: string;
  canManage?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export const UsuarioTabla = React.memo(function UsuarioTabla({
  usuarios,
  onVer,
  onEditar,
  onEliminar,
  onGestionarDispositivos,
  currentUserEmail,
  canManage = true,
  sortColumn,
  sortDirection,
  onSort,
}: UsuarioTablaProps) {
  const [internalSortColumn, setInternalSortColumn] = useState<string>('');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  const effectiveSortColumn = sortColumn !== undefined ? sortColumn : internalSortColumn;
  const effectiveSortDirection = sortDirection !== undefined ? sortDirection : internalSortDirection;

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    } else {
      if (internalSortColumn === column) {
        setInternalSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setInternalSortColumn(column);
        setInternalSortDirection('asc');
      }
    }
  };

  const sortIndicator = (column: string) =>
    effectiveSortColumn === column ? (effectiveSortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  const sortedUsuarios = useMemo(() => {
    // Si el padre ya maneja el ordenamiento global de la lista, usar directamente
    if (onSort) return usuarios;
    if (!effectiveSortColumn) return usuarios;

    const sorted = [...usuarios].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      switch (effectiveSortColumn) {
        case 'nombre':
          aVal = (a.nombre || `${a.primer_nombre} ${a.primer_apellido}`).toLowerCase();
          bVal = (b.nombre || `${b.primer_nombre} ${b.primer_apellido}`).toLowerCase();
          break;
        case 'correo':
          aVal = a.correo.toLowerCase();
          bVal = b.correo.toLowerCase();
          break;
        case 'rol':
          aVal = (a.rol || '').toLowerCase();
          bVal = (b.rol || '').toLowerCase();
          break;
        case 'estado': {
          const aSusp = a.estado === 'Suspendido' || (a as any).activo === false;
          const bSusp = b.estado === 'Suspendido' || (b as any).activo === false;
          const aSes = obtenerSesionesUsuario(a.correo).length > 0;
          const bSes = obtenerSesionesUsuario(b.correo).length > 0;
          aVal = aSusp ? '3_suspendido' : (aSes ? '1_activo' : '2_inactivo');
          bVal = bSusp ? '3_suspendido' : (bSes ? '1_activo' : '2_inactivo');
          break;
        }
        case 'ultimoAcceso':
          aVal = (a.ultimoAcceso || '').toLowerCase();
          bVal = (b.ultimoAcceso || '').toLowerCase();
          break;
        default:
          return 0;
      }
      const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      return effectiveSortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [usuarios, effectiveSortColumn, effectiveSortDirection, onSort]);

  return (
    <div className="font-poppins">
      {/* VISTA MOBILE: Tarjetas legibles */}
      <div className="md:hidden space-y-3">
        {sortedUsuarios.map((usuario) => {
          const nombreCompleto = formatearNombrePropio(
            usuario.nombre || `${usuario.primer_nombre} ${usuario.primer_apellido}`.trim()
          );
          const iniciales = (
            (usuario.primer_nombre?.[0] || usuario.nombre?.[0] || 'U') +
            (usuario.primer_apellido?.[0] || '')
          ).toUpperCase();
          const isSelf = currentUserEmail && usuario.correo?.toLowerCase() === currentUserEmail.toLowerCase();
          const esSuspendido = usuario.estado === 'Suspendido' || (usuario as any).activo === false;
          const sesiones = obtenerSesionesUsuario(usuario.correo);
          const tieneSesiones = sesiones.length > 0;
          const estadoMostrado: EstadoUsuario = esSuspendido ? 'Suspendido' : 'Activo';


          return (
            <div
              key={`mob-${usuario.id}`}
              className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2.5 text-[11px]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#9B0F06] flex items-center justify-center text-white font-bold text-[10.5px] shrink-0">
                    {iniciales}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">
                      {nombreCompleto}
                    </p>
                    <p className="text-[10px] text-[#9B0F06] font-semibold truncate mt-0.5">
                      {usuario.username ? `@${usuario.username.toUpperCase()}` : usuario.correo}
                    </p>
                    {usuario.username && (
                      <p className="text-[9.5px] text-gray-400 truncate">{usuario.correo}</p>
                    )}
                  </div>
                </div>
                <UsuarioEstadoBadge estado={estadoMostrado} />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-[10.5px]">
                <UsuarioRolBadge rol={usuario.rol} />
              </div>

              {/* Registro de accesos: Dos campos separados con color negro */}
              <div className="space-y-1 pt-1 border-t border-gray-100 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-semibold uppercase text-[9px]">Último Acceso:</span>
                  <span className="font-medium text-gray-700">{usuario.ultimoAcceso || 'Sin accesos todavía'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-semibold uppercase text-[9px]">Cantidad de Ingresos:</span>
                  <span className="font-bold text-gray-900">{sesiones.length} {sesiones.length === 1 ? 'ingreso' : 'ingresos'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onVer(usuario)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[10px] font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
                  title="Ver detalle"
                >
                  <Eye size={12} className="text-gray-500" />
                  <span>Ver</span>
                </button>

                {canManage && <button
                  type="button"
                  onClick={() => onEditar(usuario)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[10px] font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
                  title="Editar usuario"
                >
                  <Edit2 size={12} className="text-gray-600" />
                  <span>Editar</span>
                </button>}

                {canManage && (isSelf || tieneSesiones) && (
                  <button
                    type="button"
                    onClick={() => onGestionarDispositivos?.(usuario)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[10px] font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs relative"
                    title={
                      isSelf
                        ? 'Gestionar mis dispositivos conectados'
                        : `Dispositivos conectados (${sesiones.length} de 2)`
                    }
                  >
                    <Laptop size={12} className="text-gray-600" />
                    <span>{isSelf ? 'Mis Equipos' : `Equipos (${sesiones.length})`}</span>
                  </button>
                )}

                {canManage && (esSuspendido ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEliminar(usuario.id, 'activar')}
                      className="p-1 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Activar usuario"
                    >
                      <CheckCircle size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(usuario.id, 'eliminar')}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Eliminar usuario definitivamente"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onEliminar(usuario.id, 'suspender')}
                      className="p-1 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                      title="Suspender usuario (bloquea su acceso)"
                    >
                      <UserX size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(usuario.id, 'eliminar')}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Eliminar usuario definitivamente"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA DESKTOP: Tabla completa */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('nombre')}
                >
                  Usuario{sortIndicator('nombre')}
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('correo')}
                >
                  Correo{sortIndicator('correo')}
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('rol')}
                >
                  Rol{sortIndicator('rol')}
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('estado')}
                >
                  Estado{sortIndicator('estado')}
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('ultimoAcceso')}
                >
                  Último Acceso{sortIndicator('ultimoAcceso')}
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => handleSort('contadorAccesos')}
                >
                  Ingresos{sortIndicator('contadorAccesos')}
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {sortedUsuarios.map((usuario) => {
                const nombreCompleto = formatearNombrePropio(
                  usuario.nombre || `${usuario.primer_nombre} ${usuario.primer_apellido}`.trim()
                );
                const iniciales = (
                  (usuario.primer_nombre?.[0] || usuario.nombre?.[0] || 'U') +
                  (usuario.primer_apellido?.[0] || '')
                ).toUpperCase();
                const isSelf = currentUserEmail && usuario.correo?.toLowerCase() === currentUserEmail.toLowerCase();
                const esSuspendido = usuario.estado === 'Suspendido' || (usuario as any).activo === false;
                const sesiones = obtenerSesionesUsuario(usuario.correo);
                const tieneSesiones = sesiones.length > 0;
                const estadoMostrado: EstadoUsuario = esSuspendido ? 'Suspendido' : (tieneSesiones ? 'Activo' : 'Inactivo');


                return (
                  <tr key={usuario.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#9B0F06] text-[11px] font-bold text-white flex items-center justify-center shrink-0 shadow-2xs">
                          {iniciales}
                        </div>
                        <div>
                          <p className="font-bold text-[12px] text-gray-900 leading-tight">
                            {nombreCompleto}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {usuario.username && (
                              <span className="text-[10.5px] font-semibold text-[#9B0F06]">
                                @{usuario.username.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[9.5px] text-gray-400">
                              (ID: {usuario.id.slice(0, 8)}...)
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium text-[11px]">{usuario.correo}</td>
                    <td className="px-4 py-3.5">
                      <UsuarioRolBadge rol={usuario.rol} />
                    </td>
                    <td className="px-4 py-3.5">
                      <UsuarioEstadoBadge estado={estadoMostrado} />
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-gray-700 font-medium">
                      {usuario.ultimoAcceso || 'Sin accesos todavía'}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] font-semibold text-gray-900">
                      {sesiones.length} {sesiones.length === 1 ? 'ingreso' : 'ingresos'}
                    </td>
                    <td className="text-right px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onVer(usuario)}
                          className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors cursor-pointer"
                          title="Ver detalle del usuario"
                        >
                          <Eye size={13} />
                        </button>

                        {canManage && <button
                          type="button"
                          onClick={() => onEditar(usuario)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <Edit2 size={13} />
                        </button>}

                        {canManage && (isSelf || tieneSesiones) && (
                          <button
                            type="button"
                            onClick={() => onGestionarDispositivos?.(usuario)}
                            className="p-1 text-gray-400 hover:text-[#3B2219] transition-colors cursor-pointer relative"
                            title={
                              isSelf
                                ? 'Gestionar mis dispositivos conectados'
                                : `Dispositivos conectados (${sesiones.length} de 2)`
                            }
                          >
                            <Laptop size={13} />
                            {sesiones.length > 1 && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                                {sesiones.length}
                              </span>
                            )}
                          </button>
                        )}

                        {canManage && (esSuspendido ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEliminar(usuario.id, 'activar')}
                              className="p-1 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Activar usuario"
                            >
                              <CheckCircle size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEliminar(usuario.id, 'eliminar')}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar usuario definitivamente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEliminar(usuario.id, 'suspender')}
                              className="p-1 text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                              title="Suspender usuario (bloquea su acceso)"
                            >
                              <UserX size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEliminar(usuario.id, 'eliminar')}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar usuario definitivamente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
