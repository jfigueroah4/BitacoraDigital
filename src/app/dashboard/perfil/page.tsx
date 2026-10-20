'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  UserCheck,
  User,
  Mail,
  Calendar,
  Pencil,
  X,
  ArrowLeft,
  Shield,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  AtSign,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { UserProfile } from '@/types/bitacora';
import { Usuario } from '@/types/usuario';
import { formatearNombrePropio } from '@/lib/utils/formatters';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase/client';

export default function PerfilPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Profile data
  const [primerNombre, setPrimerNombre] = useState('Daniel');
  const [segundoNombre, setSegundoNombre] = useState('Josue');
  const [primerApellido, setPrimerApellido] = useState('Figueroa');
  const [segundoApellido, setSegundoApellido] = useState('Herrera');
  const [username, setUsername] = useState('danielfigueroa');
  const [correo, setCorreo] = useState('admin@bitacoradigital.com');
  const [telefono, setTelefono] = useState('+502 5625 2922');
  const [direccion, setDireccion] = useState('Ciudad de Guatemala / Villa Nueva');
  const [fechaNacimiento, setFechaNacimiento] = useState('1994-06-15');
  const [rol, setRol] = useState('Administrador');
  const [cargo, setCargo] = useState('Administrador de Proyecto');
  const [fechaRegistro, setFechaRegistro] = useState('2026-01-10');
  const [ultimoAcceso, setUltimoAcceso] = useState('2026-10-15 18:30');

  // Form states inside Drawer
  const [formPN, setFormPN] = useState(primerNombre);
  const [formSN, setFormSN] = useState(segundoNombre);
  const [formPA, setFormPA] = useState(primerApellido);
  const [formSA, setFormSA] = useState(segundoApellido);
  const [formUsername, setFormUsername] = useState(username);
  const [formCorreo, setFormCorreo] = useState(correo);
  const [formTelefono, setFormTelefono] = useState(telefono);
  const [formDireccion, setFormDireccion] = useState(direccion);
  const [formFechaNac, setFormFechaNac] = useState(fechaNacimiento);
  const [formCargo, setFormCargo] = useState(cargo);

  // Password inside Drawer
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bitacora_user_profile');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.nombre) {
          const partes = u.nombre.trim().split(/\s+/);
          if (partes.length >= 2) {
            setPrimerNombre(partes[0]);
            setPrimerApellido(partes[partes.length - 1]);
            setSegundoNombre(partes.slice(1, -1).join(' ') || '');
          } else {
            setPrimerNombre(u.nombre);
          }
        }
        if (u.email) setCorreo(u.email);
        if (u.username) setUsername(u.username);
        else if (u.email) setUsername(u.email.split('@')[0]);
        if (u.rol) setRol(u.rol);
        if (u.cargo) setCargo(u.cargo);
      }
    } catch (_) {}
  }, []);

  const syncFormWithCurrent = () => {
    setFormPN(primerNombre);
    setFormSN(segundoNombre);
    setFormPA(primerApellido);
    setFormSA(segundoApellido);
    setFormUsername(username);
    setFormCorreo(correo);
    setFormTelefono(telefono);
    setFormDireccion(direccion);
    setFormFechaNac(fechaNacimiento);
    setFormCargo(cargo);
    setNuevaContrasena('');
    setConfirmarContrasena('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenDrawer = () => {
    syncFormWithCurrent();
    setIsDrawerOpen(true);
  };

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nuevaContrasena && nuevaContrasena !== confirmarContrasena) {
      showErrorToast('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsSubmitting(true);
    try {
      setPrimerNombre(formPN.trim());
      setSegundoNombre(formSN.trim());
      setPrimerApellido(formPA.trim());
      setSegundoApellido(formSA.trim());
      setUsername(formUsername.trim().toLowerCase());
      setCorreo(formCorreo.trim());
      setTelefono(formTelefono.trim());
      setDireccion(formDireccion.trim());
      setFechaNacimiento(formFechaNac);
      setCargo(formCargo.trim());

      const nombreCompletoActualizado = formatearNombrePropio(
        `${formPN} ${formSN} ${formPA} ${formSA}`.replace(/\s+/g, ' ').trim()
      );

      const profilePayload: UserProfile = {
        id: 'admin',
        nombre: nombreCompletoActualizado,
        email: formCorreo.trim(),
        username: formUsername.trim().toLowerCase(),
        rol: rol as any,
        cargo: formCargo.trim(),
      };

      localStorage.setItem('bitacora_user_profile', JSON.stringify(profilePayload));

      // Also update in registered users list if exists
      try {
        const storedUsers = localStorage.getItem('bitacora_usuarios_lista');
        if (storedUsers) {
          const list: Usuario[] = JSON.parse(storedUsers);
          const updatedList = list.map((u) => {
            if (u.correo.toLowerCase() === correo.toLowerCase() || u.username === username) {
              return {
                ...u,
                primer_nombre: formPN.trim(),
                segundo_nombre: formSN.trim() || null,
                primer_apellido: formPA.trim(),
                segundo_apellido: formSA.trim() || null,
                nombre: nombreCompletoActualizado,
                username: formUsername.trim().toLowerCase(),
                correo: formCorreo.trim(),
                telefono: formTelefono.trim(),
                cargo: formCargo.trim(),
                direccion: formDireccion.trim(),
              };
            }
            return u;
          });
          localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(updatedList));
        }
      } catch (_) {}

      // Update Supabase password if provided and available
      if (nuevaContrasena && supabase) {
        try {
          await supabase.auth.updateUser({ password: nuevaContrasena });
        } catch (_) {}
      }

      showSuccessToast('¡Perfil actualizado correctamente!');
      setIsDrawerOpen(false);
      setIsEditing(false);
    } catch (_) {
      showErrorToast('Error al guardar los cambios del perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nombreCompleto = formatearNombrePropio(
    `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim()
  );
  const iniciales = `${primerNombre[0] || ''}${primerApellido[0] || ''}`.toUpperCase();

  // Helper para renderizar campo con valor y lápiz interactivo idéntico a DomunNet
  const EditableField = ({
    label,
    value,
    fallback = 'No registrado',
    editable = true,
  }: {
    label: string;
    value: string | null | undefined;
    fallback?: string;
    editable?: boolean;
  }) => (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs sm:text-sm font-semibold text-gray-800 break-words">
          {value || fallback}
        </p>
        {isEditing && editable && (
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="text-[#3B2219] hover:text-[#2A1710] transition-colors p-1 rounded-lg hover:bg-[#F4ECE6] active:scale-95 cursor-pointer shrink-0"
            title={`Editar ${label}`}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      <TopBar seccion="Mi Perfil" bitacoraNombre="Proyecto: Conexion VAS – Hincapie" />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Header con botón Volver y Toggle de Edición */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-700 bg-white/70 border border-gray-200 shadow-2xs cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                Gestión de Perfil
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Información personal, datos de contacto, rol y seguridad de acceso
              </p>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Settings size={15} />
              <span>Editar Perfil</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <X size={15} />
              <span>Cancelar Edición</span>
            </button>
          )}
        </div>

        {/* Tarjeta 1 - Resumen Principal (Idéntica a DomunNet) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#3B2219] rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg shadow-xs">
              {iniciales}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {nombreCompleto}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <UserCheck size={14} />
                  <span>Estado: Activo</span>
                </span>
                <span className="text-gray-300">&bull;</span>
                <span className="text-xs text-gray-500 font-medium">{rol}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Miembro registrado desde {fechaRegistro}
              </p>
            </div>
          </div>
        </div>

        {/* Cuadrícula de 4 Tarjetas idéntica a DomunNet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta 1 - Información Personal */}
          <div className="bg-white rounded-2xl p-5 shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <User size={16} className="text-[#3B2219]" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                Información Personal
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <EditableField label="Primer Nombre" value={primerNombre} />
              <EditableField label="Segundo Nombre" value={segundoNombre} fallback="-" />
              <EditableField label="Primer Apellido" value={primerApellido} />
              <EditableField label="Segundo Apellido" value={segundoApellido} fallback="-" />
              <div className="col-span-2">
                <EditableField label="Nombre de Usuario" value={`@${username}`} />
              </div>
              <div className="col-span-2">
                <EditableField label="Correo Electrónico" value={correo} />
              </div>
            </div>
          </div>

          {/* Tarjeta 2 - Información de Contacto */}
          <div className="bg-white rounded-2xl p-5 shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Mail size={16} className="text-[#3B2219]" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                Información de Contacto
              </h3>
            </div>
            <div className="space-y-3.5">
              <EditableField label="Teléfono / WhatsApp" value={telefono} />
              <EditableField label="Dirección / Ubicación" value={direccion} />
            </div>
          </div>

          {/* Tarjeta 3 - Información Adicional */}
          <div className="bg-white rounded-2xl p-5 shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Calendar size={16} className="text-[#3B2219]" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                Información Adicional
              </h3>
            </div>
            <div className="space-y-3.5">
              <EditableField label="Fecha de Nacimiento" value={fechaNacimiento} />
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Último Acceso al Sistema
                </label>
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">
                  {ultimoAcceso}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 4 - Rol y Seguridad de Acceso */}
          <div className="bg-white rounded-2xl p-5 shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <Shield size={16} className="text-[#3B2219]" />
              <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                Rol y Seguridad
              </h3>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Rol del Sistema
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F4ECE6] text-[#3B2219]">
                    {rol}
                  </span>
                </div>
              </div>
              <EditableField label="Puesto o Cargo" value={cargo} />
              <EditableField label="Contraseña" value="••••••••••••" />
            </div>
          </div>
        </div>
      </main>

      {/* Drawer Slide-Over para Editar Perfil (Idéntico a DomunNet) */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col font-poppins animate-slideInRight border-l border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3B2219]/10 flex items-center justify-center text-[#3B2219]">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    Editar Información del Perfil
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Modifica tus datos de usuario, contacto o contraseña
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form id="perfil-drawer-form" onSubmit={handleSavePerfil} className="space-y-4">
                {/* Nombres */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Primer Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formPN}
                      onChange={(e) => setFormPN(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      value={formSN}
                      onChange={(e) => setFormSN(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
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
                      value={formPA}
                      onChange={(e) => setFormPA(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={formSA}
                      onChange={(e) => setFormSA(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                </div>

                {/* Nombre de Usuario y Correo */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Nombre de Usuario <span className="text-gray-400 font-normal">(Login)</span>
                    </label>
                    <div className="relative">
                      <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
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
                        value={formCorreo}
                        onChange={(e) => setFormCorreo(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
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
                        value={formTelefono}
                        onChange={(e) => setFormTelefono(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                      />
                    </div>
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Puesto o Cargo
                  </label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formCargo}
                      onChange={(e) => setFormCargo(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                </div>

                {/* Dirección y Fecha Nacimiento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Fecha Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formFechaNac}
                      onChange={(e) => setFormFechaNac(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                    />
                  </div>
                </div>

                {/* Sección Cambiar Contraseña con Ojo y Verificación */}
                <div className="space-y-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Lock size={13} className="text-[#3B2219]" />
                    <span>Cambiar Contraseña (Opcional)</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Dejar en blanco para no cambiar"
                        value={nuevaContrasena}
                        onChange={(e) => setNuevaContrasena(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite la nueva contraseña"
                        value={confirmarContrasena}
                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                        className={`w-full pl-9 pr-9 py-2 bg-white border rounded-xl text-xs text-gray-800 outline-none transition-colors ${
                          confirmarContrasena && nuevaContrasena !== confirmarContrasena
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#3B2219]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {confirmarContrasena && nuevaContrasena !== confirmarContrasena && (
                      <p className="text-[10px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                        <span>✕</span> Las contraseñas no coinciden
                      </p>
                    )}
                    {confirmarContrasena && nuevaContrasena === confirmarContrasena && (
                      <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                        <span>✓</span> Las contraseñas coinciden correctamente
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="perfil-drawer-form"
                disabled={isSubmitting || (Boolean(nuevaContrasena) && nuevaContrasena !== confirmarContrasena)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

