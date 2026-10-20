'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  AtSign,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import { formatearNombrePropio } from '@/lib/utils/formatters';
import { showErrorToast } from '@/components/ui/Toast';

export type UsuarioDrawerMode = 'create' | 'edit' | 'view';

interface UsuarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payload: any) => Promise<void> | void;
  usuario?: Usuario;
  mode: UsuarioDrawerMode;
  onSwitchToEdit?: () => void;
  usuariosExistentes?: Usuario[];
}

const ROLES_LISTA: RolUsuario[] = ['Administrador', 'Usuario'];

// Función para normalizar texto a formato de username en MAYÚSCULAS (ej. "José Pérez" -> "JPEREZ")
export function generarUsernameSugerido(nombre: string, apellido: string): string {
  const normalizar = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''); // Solo alfanuméricos

  const n = normalizar(nombre.trim());
  const a = normalizar(apellido.trim());

  if (n && a) {
    return `${n.charAt(0)}${a}`;
  }
  if (a) return a;
  return n;
}

// Función para generar contraseña segura en MAYÚSCULAS
export function generarContrasenaSugerida(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  let randLetras = '';
  for (let i = 0; i < 4; i++) {
    randLetras += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  let randNums = '';
  for (let i = 0; i < 4; i++) {
    randNums += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }
  return `BITACORA${randNums}${randLetras}`;
}

export function UsuarioDrawer({
  isOpen,
  onClose,
  onSave,
  usuario,
  mode,
  onSwitchToEdit,
  usuariosExistentes = [],
}: UsuarioDrawerProps) {
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAuto, setIsUsernameAuto] = useState(true);
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
      setIsUsernameAuto(false);
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
      setIsUsernameAuto(true);
      setCorreo('');
      setTelefono('');
      setCargo('');
      setRol('Usuario');
      setEstado('Activo');
      setDireccion('');
      setPassword('');
      setConfirmPassword('');
    }
    setTouched({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [usuario, isOpen, mode]);

  // Actualización automática del username cuando se escribe nombre o apellido
  const handleNombreChange = (val: string) => {
    setPrimerNombre(val);
    if (isUsernameAuto && mode === 'create') {
      const sugerido = generarUsernameSugerido(val, primerApellido);
      setUsername(sugerido);
    }
  };

  const handleApellidoChange = (val: string) => {
    setPrimerApellido(val);
    if (isUsernameAuto && mode === 'create') {
      const sugerido = generarUsernameSugerido(primerNombre, val);
      setUsername(sugerido);
    }
  };

  const handleRegenerarUsername = () => {
    const sugerido = generarUsernameSugerido(primerNombre, primerApellido);
    setUsername(sugerido);
    setIsUsernameAuto(true);
  };

  // Validaciones DomunNet
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validPrimerNombre = useMemo(() => {
    const val = primerNombre.trim();
    if (!val) return false;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,40}$/.test(val);
  }, [primerNombre]);

  const validPrimerApellido = useMemo(() => {
    const val = primerApellido.trim();
    if (!val) return false;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{2,40}$/.test(val);
  }, [primerApellido]);

  const validUsername = useMemo(() => {
    const val = username.trim();
    if (!val) return true; // Puede ser opcional, pero si está, debe cumplir formato
    return /^[a-z0-9._]{3,30}$/.test(val);
  }, [username]);

  const isUsernameDuplicated = useMemo(() => {
    const val = (username.trim() || (isUsernameAuto ? generarUsernameSugerido(primerNombre, primerApellido) : '')).toLowerCase();
    if (!val || !usuariosExistentes || usuariosExistentes.length === 0) return false;
    return usuariosExistentes.some((u) => {
      if (usuario && (u.id === usuario.id || u.correo?.toLowerCase() === usuario.correo?.toLowerCase())) {
        return false;
      }
      return u.username && u.username.trim().toLowerCase() === val;
    });
  }, [username, isUsernameAuto, primerNombre, primerApellido, usuariosExistentes, usuario]);

  const isEmailDuplicated = useMemo(() => {
    const val = correo.trim().toLowerCase();
    if (!val || !usuariosExistentes || usuariosExistentes.length === 0) return false;
    return usuariosExistentes.some((u) => {
      if (usuario && (u.id === usuario.id || u.correo?.toLowerCase() === usuario.correo?.toLowerCase())) {
        return false;
      }
      return u.correo && u.correo.trim().toLowerCase() === val;
    });
  }, [correo, usuariosExistentes, usuario]);

  const isTelefonoDuplicated = useMemo(() => {
    const telClean = telefono.replace(/[^0-9]/g, '');
    if (!telClean || telClean.length < 7 || !usuariosExistentes || usuariosExistentes.length === 0) return false;
    return usuariosExistentes.some((u) => {
      if (usuario && (u.id === usuario.id || u.correo?.toLowerCase() === usuario.correo?.toLowerCase())) {
        return false;
      }
      const uTel = (u.telefono || '').replace(/[^0-9]/g, '');
      return uTel && uTel === telClean;
    });
  }, [telefono, usuariosExistentes, usuario]);

  const validCorreo = useMemo(() => {
    const val = correo.trim();
    if (!val) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
  }, [correo]);

  const validTelefono = useMemo(() => {
    const val = telefono.trim();
    if (!val) return true; // Opcional
    return /^[0-9+()-\s]{7,20}$/.test(val);
  }, [telefono]);

  // Medidor de fuerza de contraseña
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) score += 1;
    return score; // 0 a 4
  }, [password]);

  const validPassword = useMemo(() => {
    if (mode === 'create') {
      return password.length >= 6;
    }
    return !password || password.length >= 6;
  }, [mode, password]);

  const passwordsMatch = useMemo(() => {
    if (mode === 'create' || password) {
      return password === confirmPassword && confirmPassword.length > 0;
    }
    return true;
  }, [mode, password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      validPrimerNombre &&
      validPrimerApellido &&
      validCorreo &&
      validUsername &&
      !isUsernameDuplicated &&
      !isEmailDuplicated &&
      !isTelefonoDuplicated &&
      validTelefono &&
      validPassword &&
      passwordsMatch
    );
  }, [
    validPrimerNombre,
    validPrimerApellido,
    validCorreo,
    validUsername,
    isUsernameDuplicated,
    isEmailDuplicated,
    isTelefonoDuplicated,
    validTelefono,
    validPassword,
    passwordsMatch,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validPrimerNombre) {
      showErrorToast('El primer nombre debe contener al menos 2 letras válidas.');
      return;
    }
    if (!validPrimerApellido) {
      showErrorToast('El primer apellido debe contener al menos 2 letras válidas.');
      return;
    }
    if (!validCorreo) {
      showErrorToast('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (isEmailDuplicated) {
      showErrorToast(`El correo electrónico "${correo.trim()}" ya está registrado por otro usuario.`);
      return;
    }
    if (username && !validUsername) {
      showErrorToast('El nombre de usuario debe tener mínimo 3 caracteres alfanuméricos.');
      return;
    }
    if (isUsernameDuplicated) {
      const uNameFinal = username.trim() || generarUsernameSugerido(primerNombre, primerApellido);
      showErrorToast(`El nombre de usuario "@${uNameFinal}" ya se encuentra registrado por otro usuario. Elige uno diferente.`);
      return;
    }
    if (isTelefonoDuplicated) {
      showErrorToast(`El número de teléfono "${telefono.trim()}" ya se encuentra registrado por otro usuario.`);
      return;
    }
    if ((mode === 'create' || password) && !passwordsMatch) {
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
        username: username.trim().toLowerCase() || generarUsernameSugerido(primerNombre, primerApellido),
        correo: correo.trim().toLowerCase(),
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
                  ? 'Registra un nuevo usuario con validaciones DomunNet y acceso seguro'
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
                    <p className="text-[11px] text-[#9B0F06] font-semibold">@{usuario.username}</p>
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
            {/* Nombres con validación DomunNet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Primer Nombre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. Daniel"
                    value={primerNombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    onBlur={() => markTouched('primerNombre')}
                    disabled={isView}
                    required
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-colors disabled:bg-gray-100/60 disabled:text-gray-600 ${
                      touched.primerNombre && !validPrimerNombre
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : touched.primerNombre && validPrimerNombre
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  {touched.primerNombre && validPrimerNombre && (
                    <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>
                {touched.primerNombre && !validPrimerNombre && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Solo letras, mín. 2 caracteres
                  </p>
                )}
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

            {/* Apellidos con validación DomunNet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Primer Apellido <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. Figueroa"
                    value={primerApellido}
                    onChange={(e) => handleApellidoChange(e.target.value)}
                    onBlur={() => markTouched('primerApellido')}
                    disabled={isView}
                    required
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-colors disabled:bg-gray-100/60 disabled:text-gray-600 ${
                      touched.primerApellido && !validPrimerApellido
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : touched.primerApellido && validPrimerApellido
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  {touched.primerApellido && validPrimerApellido && (
                    <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>
                {touched.primerApellido && !validPrimerApellido && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Solo letras, mín. 2 caracteres
                  </p>
                )}
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

            {/* Generación Automática de Username (estilo DomunNet) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <span>Nombre de Usuario</span>
                  {isUsernameAuto && !isView && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded border border-amber-200/60">
                      Auto
                    </span>
                  )}
                </label>
                {!isView && (
                  <button
                    type="button"
                    onClick={handleRegenerarUsername}
                    disabled={!primerNombre && !primerApellido}
                    title="Generar username a partir del nombre y apellido"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9B0F06] hover:text-[#5E0006] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={11} />
                    <span>Autogenerar</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ej. dfigueroa"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''));
                    setIsUsernameAuto(false);
                  }}
                  onBlur={() => markTouched('username')}
                  disabled={isView}
                  className={`w-full pl-9 pr-8 py-2 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-colors disabled:bg-gray-100/60 disabled:text-gray-600 font-mono ${
                    (touched.username && !validUsername) || isUsernameDuplicated
                      ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                      : touched.username && validUsername && username && !isUsernameDuplicated
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                {username && validUsername && !isUsernameDuplicated && (
                  <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                )}
              </div>
              {username && !validUsername && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Mínimo 3 caracteres (solo letras minúsculas, números, punto o guión bajo)
                </p>
              )}
              {isUsernameDuplicated && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Este nombre de usuario ya está registrado por otro usuario
                </p>
              )}
              {username && validUsername && !isUsernameDuplicated && isCreate && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Podrá iniciar sesión escribiendo <span className="font-semibold text-gray-600 font-mono">@{username}</span>
                </p>
              )}
            </div>

            {/* Correo Electrónico con validación DomunNet */}
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
                  onBlur={() => markTouched('correo')}
                  disabled={isView}
                  required
                  className={`w-full pl-9 pr-8 py-2 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-colors disabled:bg-gray-100/60 disabled:text-gray-600 ${
                    (touched.correo && !validCorreo) || isEmailDuplicated
                      ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                      : touched.correo && validCorreo && !isEmailDuplicated
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                {touched.correo && validCorreo && !isEmailDuplicated && (
                  <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                )}
              </div>
              {touched.correo && !validCorreo && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Formato de correo electrónico inválido
                </p>
              )}
              {isEmailDuplicated && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Este correo electrónico ya se encuentra registrado
                </p>
              )}
            </div>

            {/* Teléfono / WhatsApp */}
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
                  onBlur={() => markTouched('telefono')}
                  disabled={isView}
                  className={`w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-xl text-xs text-gray-800 outline-none transition-colors disabled:bg-gray-100/60 disabled:text-gray-600 ${
                    (touched.telefono && !validTelefono) || isTelefonoDuplicated
                      ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                      : touched.telefono && validTelefono && telefono && !isTelefonoDuplicated
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                {touched.telefono && validTelefono && telefono && !isTelefonoDuplicated && (
                  <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                )}
              </div>
              {touched.telefono && !validTelefono && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Ingresa un número telefónico válido (mín. 8 dígitos)
                </p>
              )}
              {isTelefonoDuplicated && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Este número de teléfono ya se encuentra registrado por otro usuario
                </p>
              )}
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

            {/* Contraseña con Medidor de Fuerza DomunNet (Solo creación o edición) */}
            {!isView && (
              <div className="space-y-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200/70">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    {isCreate ? (
                      <>
                        Contraseña de Acceso <span className="text-red-500">*</span>
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
                      onBlur={() => markTouched('password')}
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

                  {/* Medidor de seguridad */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 1
                              ? 'w-1/4 bg-red-500'
                              : passwordStrength === 2
                              ? 'w-2/4 bg-amber-500'
                              : passwordStrength === 3
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">Nivel de seguridad:</span>
                        <span
                          className={`font-semibold ${
                            passwordStrength <= 1
                              ? 'text-red-600'
                              : passwordStrength === 2
                              ? 'text-amber-600'
                              : passwordStrength === 3
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {passwordStrength <= 1
                            ? 'Débil (mín. 6 caracteres)'
                            : passwordStrength === 2
                            ? 'Aceptable'
                            : passwordStrength === 3
                            ? 'Buena'
                            : 'Muy Fuerte'}
                        </span>
                      </div>
                    </div>
                  )}
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
                      onBlur={() => markTouched('confirmPassword')}
                      required={isCreate || Boolean(password)}
                      className={`w-full pl-9 pr-9 py-2 bg-white border rounded-xl text-xs text-gray-800 outline-none transition-colors ${
                        confirmPassword && !passwordsMatch
                          ? 'border-red-400 focus:border-red-500'
                          : confirmPassword && passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-500'
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

                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[10px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle size={11} /> Las contraseñas no coinciden
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={11} /> Las contraseñas coinciden correctamente
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
                  El usuario se registrará con perfil activo y podrá ingresar mediante correo o nombre de usuario.
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
              disabled={isSubmitting || !isFormValid}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
