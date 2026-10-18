'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Edit2,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
  AtSign,
} from 'lucide-react';
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import { formatearNombrePropio } from '@/lib/utils/formatters';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

export type UsuarioDrawerMode = 'create' | 'edit' | 'view';

interface UsuarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payload: any) => Promise<void> | void;
  usuario?: Usuario;
  mode: UsuarioDrawerMode;
  onSwitchToEdit?: () => void;
}

const ROLES_LISTA: RolUsuario[] = [
  'Administrador',
  'Usuario',
];

export function UsuarioDrawer({
  isOpen,
  onClose,
  onSave,
  usuario,
  mode,
  onSwitchToEdit,
}: UsuarioDrawerProps) {
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [username, setUsername] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');
  const [rol, setRol] = useState<RolUsuario>('Usuario');
  const [estado, setEstado] = useState<EstadoUsuario>('Activo');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (usuario) {
      setPrimerNombre(usuario.primer_nombre || '');
      setSegundoNombre(usuario.segundo_nombre || '');
      setPrimerApellido(usuario.primer_apellido || '');
      setSegundoApellido(usuario.segundo_apellido || '');
      setUsername(
        usuario.username ||
          (usuario.correo ? usuario.correo.split('@')[0] : '')
      );
      setCorreo(usuario.correo || '');
      setTelefono(usuario.telefono || '');
      setCargo(usuario.cargo || '');
      setRol((usuario.rol as RolUsuario) || 'Usuario');
      setEstado(usuario.estado || 'Activo');
      setDireccion(usuario.direccion || '');
      setPassword('');
      setConfirmPassword('');
    } else {
      setPrimerNombre('');
      setSegundoNombre('');
      setPrimerApellido('');
      setSegundoApellido('');
      setUsername('');
      setCorreo('');
      setTelefono('');
      setCargo('');
      setRol('Usuario');
      setEstado('Activo');
      setDireccion('');
      setPassword('');
      setConfirmPassword('');
    }
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [usuario, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((mode === 'create' || password) && password !== confirmPassword) {
      showErrorToast('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim() || null,
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || null,
        username: username.trim().toLowerCase() || null,
        correo: correo.trim(),
        telefono: telefono.trim(),
        cargo: cargo.trim() || 'Colaborador',
        rol,
        estado,
        direccion: direccion.trim() || null,
        password: password.trim() || undefined,
      };

      await onSave?.(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const nombreCompleto = formatearNombrePropio(
    usuario?.nombre || `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.trim() || 'Nuevo Usuario'
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9B0F06]/10 flex items-center justify-center text-[#9B0F06]">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {isCreate ? 'Nuevo Usuario' : isEdit ? 'Editar Usuario' : 'Detalles de Usuario'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {isCreate
                  ? 'Registra un nuevo usuario con acceso directo'
                  : isEdit
                  ? `Modificando información de ${nombreCompleto}`
                  : `Visualización de cuenta de usuario`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tarjeta de Resumen en modo VIEW */}
          {isView && usuario && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#9B0F06] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {((usuario.primer_nombre?.[0] || 'U') + (usuario.primer_apellido?.[0] || '')).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{nombreCompleto}</h4>
                  <p className="text-xs text-gray-500">{usuario.correo}</p>
                  {usuario.username && (
                    <p className="text-[11px] text-gray-400 font-medium">@{usuario.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <UsuarioRolBadge rol={usuario.rol} />
                    <span className="text-gray-300">&bull;</span>
                    <UsuarioEstadoBadge estado={usuario.estado} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onSwitchToEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer active:scale-95"
              >
                <Edit2 size={13} />
                <span>Editar</span>
              </button>
            </div>
          )}

          {/* Formulario */}
          <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Nombres */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Primer Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Daniel"
                  value={primerNombre}
                  onChange={(e) => setPrimerNombre(e.target.value)}
                  disabled={isView}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Segundo Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej. Josue"
                  value={segundoNombre}
                  onChange={(e) => setSegundoNombre(e.target.value)}
                  disabled={isView}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>
            </div>

            {/* Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Primer Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Figueroa"
                  value={primerApellido}
                  onChange={(e) => setPrimerApellido(e.target.value)}
                  disabled={isView}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  placeholder="Ej. Herrera"
                  value={segundoApellido}
                  onChange={(e) => setSegundoApellido(e.target.value)}
                  disabled={isView}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>
            </div>

            {/* Nombre de Usuario y Correo Electrónico */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Nombre de Usuario <span className="text-gray-400 font-normal">(Login con usuario)</span>
                </label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ej. danielfigueroa"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    disabled={isView}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="usuario@bitacoradigital.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    disabled={isView}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="+502 5555 9901"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={isView}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Rol y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Rol del Sistema
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as RolUsuario)}
                  disabled={isView}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 cursor-pointer"
                >
                  {ROLES_LISTA.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoUsuario)}
                  disabled={isView}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 cursor-pointer"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>
            </div>

            {/* Puesto / Cargo */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Puesto o Cargo
              </label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej. Ingeniero Residente de Pavimentos"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  disabled={isView}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>
            </div>

            {/* Contraseña y Verificación (Solo en creación o edición) */}
            {!isView && (
              <div className="space-y-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200/70">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    {isCreate ? (
                      <>
                        Contraseña <span className="text-red-500">*</span>
                      </>
                    ) : (
                      'Nueva Contraseña (Opcional)'
                    )}
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isCreate ? 'Mínimo 6 caracteres' : 'Dejar en blanco para conservar actual'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={isCreate}
                      className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Confirmar Contraseña {isCreate && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite la contraseña para verificar"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={isCreate || Boolean(password)}
                      className={`w-full pl-9 pr-9 py-2 bg-white border rounded-xl text-xs text-gray-800 outline-none transition-colors ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition-colors"
                      tabIndex={-1}
                      title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                      <span>✕</span> Las contraseñas no coinciden
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                      <span>✓</span> Las contraseñas coinciden correctamente
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Dirección */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Dirección / Ubicación
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej. Ciudad de Guatemala / Villa Nueva"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={isView}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100/60 disabled:text-gray-600"
                />
              </div>
            </div>

            {isCreate && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  El usuario podrá iniciar sesión inmediatamente con su correo o nombre de usuario.
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>

          {!isView && (
            <button
              type="submit"
              form="usuario-form"
              disabled={isSubmitting || (Boolean(password) && password !== confirmPassword)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Usuario'}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
