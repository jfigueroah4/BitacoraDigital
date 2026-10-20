'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Info, X, ChevronDown, Trash2, ShieldCheck, UserCheck } from 'lucide-react';
import LoginInput from '@/components/ui/LoginInput';
import LoginButton from '@/components/ui/LoginButton';
import PasswordRecoveryModal from '@/components/modals/PasswordRecoveryModal';
import ModalDispositivosConectados from '@/components/modals/ModalDispositivosConectados';
import { registrarSesionDispositivo } from '@/lib/services/sesiones';
import { useCustomToast } from '@/hooks/useCustomToast';
import { UserProfile, UserRole } from '@/types/bitacora';
import { supabase } from '@/lib/supabase/client';

type SavedAccount = {
  username: string;
  password?: string;
  role?: UserRole;
};

export default function LoginPage() {
  const router = useRouter();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState<SavedAccount[]>([]);
  const [showRememberedDropdown, setShowRememberedDropdown] = useState(false);
  const [modalDispositivosOpen, setModalDispositivosOpen] = useState(false);
  const [usuarioParaDispositivos, setUsuarioParaDispositivos] = useState<UserProfile | null>(null);

  const { showErrorToast, showSuccessToast } = useCustomToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bitacora_remembered_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRememberedAccounts(parsed);
          setUsername(parsed[0].username);
          if (parsed[0].password) {
            setPassword(parsed[0].password);
          }
          setRememberMe(true);
        }
      }
    } catch (err) {
      console.error('Error cargando cuentas recordadas:', err);
    }

    try {
      router.prefetch('/dashboard');
    } catch (_) {}
  }, [router]);

  const removeRememberedAccount = (usernameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rememberedAccounts.filter(
      (a) => a.username.toLowerCase() !== usernameToRemove.toLowerCase()
    );
    setRememberedAccounts(updated);
    localStorage.setItem('bitacora_remembered_accounts', JSON.stringify(updated));
    if (username.toLowerCase() === usernameToRemove.toLowerCase()) {
      if (updated.length > 0) {
        setUsername(updated[0].username);
        setPassword(updated[0].password || '');
      } else {
        setUsername('');
        setPassword('');
        setRememberMe(false);
        setShowRememberedDropdown(false);
      }
    }
  };

  const selectRememberedAccount = (acc: SavedAccount) => {
    setUsername(acc.username);
    setPassword(acc.password || '');
    setRememberMe(true);
    setShowRememberedDropdown(false);
    setEmailError(false);
    setPasswordError(false);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 0. Verificar bloqueo por intentos fallidos (1 hora)
    try {
      const storedLock = localStorage.getItem('bitacora_failed_login_attempts');
      if (storedLock) {
        const { lockUntil } = JSON.parse(storedLock);
        if (lockUntil && Date.now() < lockUntil) {
          const minRest = Math.ceil((lockUntil - Date.now()) / (60 * 1000));
          showErrorToast(
            `Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente durante 1 hora (${minRest} min restantes).`
          );
          return;
        }
      }
    } catch (_) {}

    if (!username.trim() || !password.trim()) {
      if (!username.trim()) setEmailError(true);
      if (!password.trim()) setPasswordError(true);
      showErrorToast('Ingresa tu correo/usuario y contraseña para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userTrim = username.trim().toLowerCase();
      const cleanUser = userTrim.startsWith('@') ? userTrim.substring(1) : userTrim;
      const passTrim = password.trim();

      let authUser: UserProfile | null = null;
      let emailParaAuth = userTrim.includes('@') && userTrim.includes('.') ? userTrim : '';

      // Mapeo directo de usuarios base conocidos por su username
      const usuariosBaseMap: Record<string, { email: string; nombre: string; rol: UserRole; cargo: string }> = {
        admin: { email: 'admin@bitacoradigital.com', nombre: 'Daniel Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        dfigueroa: { email: 'admin@bitacoradigital.com', nombre: 'Daniel Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        danielfigueroa: { email: 'admin@bitacoradigital.com', nombre: 'Daniel Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        'admin@bitacoradigital.com': { email: 'admin@bitacoradigital.com', nombre: 'Daniel Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        jfigueroa: { email: 'jafm911@gmail.com', nombre: 'Jorge Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        jorgefigueroa: { email: 'jafm911@gmail.com', nombre: 'Jorge Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        'jafm911@gmail.com': { email: 'jafm911@gmail.com', nombre: 'Jorge Figueroa', rol: 'Administrador', cargo: 'Administrador de Proyecto' },
        adeleon: { email: 'adeleon@prodecsa.com.gt', nombre: 'Ing. Alejandra De León', rol: 'Usuario', cargo: 'Ingeniera de Proyecto (PRODECSA)' },
        'adeleon@prodecsa.com.gt': { email: 'adeleon@prodecsa.com.gt', nombre: 'Ing. Alejandra De León', rol: 'Usuario', cargo: 'Ingeniera de Proyecto (PRODECSA)' },
        jzambrano: { email: 'ingenieria01zambrano@gipsa.gt', nombre: 'Ing. Jorge Zambrano', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (GIPSA)' },
        'ingenieria01zambrano@gipsa.gt': { email: 'ingenieria01zambrano@gipsa.gt', nombre: 'Ing. Jorge Zambrano', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (GIPSA)' },
        slopez: { email: 'slopez@prodecsa.com.gt', nombre: 'Ing. Sharlyn López', rol: 'Usuario', cargo: 'Ingeniera de Proyecto (PRODECSA)' },
        'slopez@prodecsa.com.gt': { email: 'slopez@prodecsa.com.gt', nombre: 'Ing. Sharlyn López', rol: 'Usuario', cargo: 'Ingeniera de Proyecto (PRODECSA)' },
        vbarrios: { email: 'jadquisiciones@gipsa.gt', nombre: 'Ing. Vinicio Barrios', rol: 'Usuario', cargo: 'Ingeniero de Adquisiciones (GIPSA)' },
        'jadquisiciones@gipsa.gt': { email: 'jadquisiciones@gipsa.gt', nombre: 'Ing. Vinicio Barrios', rol: 'Usuario', cargo: 'Ingeniero de Adquisiciones (GIPSA)' },
        hfuentes: { email: 'hfuentes@domun.com.gt', nombre: 'Ing. Hugo Fuentes', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (DOMUN)' },
        'hfuentes@domun.com.gt': { email: 'hfuentes@domun.com.gt', nombre: 'Ing. Hugo Fuentes', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (DOMUN)' },
        ralvarado: { email: 'tektonconsultores@yahoo.com', nombre: 'Ing. Raúl Alvarado', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (DOMUN)' },
        'tektonconsultores@yahoo.com': { email: 'tektonconsultores@yahoo.com', nombre: 'Ing. Raúl Alvarado', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (DOMUN)' },
        jaldana: { email: 'jaldana@vasguatemala.com', nombre: 'Ing. José Aldana', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (SACBE)' },
        'jaldana@vasguatemala.com': { email: 'jaldana@vasguatemala.com', nombre: 'Ing. José Aldana', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (SACBE)' },
        aguillermo: { email: 'aguillermo@vasguatemala.com', nombre: 'Ing. Álvaro Guillermo', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (SACBE)' },
        'aguillermo@vasguatemala.com': { email: 'aguillermo@vasguatemala.com', nombre: 'Ing. Álvaro Guillermo', rol: 'Usuario', cargo: 'Ingeniero de Proyecto (SACBE)' },
      };

      if (!emailParaAuth && usuariosBaseMap[cleanUser]) {
        emailParaAuth = usuariosBaseMap[cleanUser].email;
      }

      // Si no se encontró en mapa base, consultar API /usuarios para soportar cualquier usuario dinámico
      if (!emailParaAuth && !userTrim.includes('@')) {
        try {
          const res = await fetch(`/api/usuarios?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.usuarios)) {
              const match = data.usuarios.find(
                (u: any) =>
                  (u.username && u.username.toLowerCase() === cleanUser) ||
                  (u.correo && u.correo.toLowerCase() === userTrim)
              );
              if (match?.correo) {
                emailParaAuth = match.correo.toLowerCase();
              }
            }
          }
        } catch (_) {}
      }

      // Buscar si el texto ingresado corresponde al username de un usuario guardado
      let listUsuarios: any[] = [];
      try {
        const stored = localStorage.getItem('bitacora_usuarios_lista');
        if (stored) listUsuarios = JSON.parse(stored);
      } catch (_) {}

      const usuarioPorUsername = listUsuarios.find(
        (u: any) =>
          (u.username && u.username.toLowerCase() === cleanUser) ||
          (u.correo && u.correo.toLowerCase() === userTrim) ||
          (u.nombre && u.nombre.toLowerCase() === cleanUser)
      );

      if (usuarioPorUsername && usuarioPorUsername.correo) {
        emailParaAuth = usuarioPorUsername.correo.toLowerCase();
      }

      // Si no se encontró localmente y es un username, consultar en Supabase
      if (!emailParaAuth && !userTrim.includes('@') && supabase) {
        try {
          const { data: dbPerfil } = await supabase
            .from('perfil_usuario')
            .select('*, usuario(*)')
            .ilike('username', cleanUser)
            .maybeSingle();

          if (dbPerfil?.usuario?.correo || dbPerfil?.correo) {
            emailParaAuth = (dbPerfil.usuario?.correo || dbPerfil.correo).toLowerCase();
          }
        } catch (_) {}
      }

      // 1. Intentar inicio de sesión en Supabase Auth (por correo directo o correo resuelto del username)
      if (supabase && emailParaAuth) {
        try {
          const { data: authRes, error: sbError } = await supabase.auth.signInWithPassword({
            email: emailParaAuth,
            password: passTrim,
          });

          if (authRes?.user && !sbError) {
            const { data: perfilData } = await supabase
              .from('perfil_usuario')
              .select('*, usuario(*, rol(*))')
              .eq('usuario_id', authRes.user.id)
              .maybeSingle();

            const userMeta = authRes.user.user_metadata || {};
            const baseMatch = usuariosBaseMap[emailParaAuth.toLowerCase()] || usuariosBaseMap[cleanUser];
            const rolNombre = userMeta.rol || perfilData?.usuario?.rol?.nombre_rol || baseMatch?.rol || 'Usuario';
            
            const rawNombre =
              userMeta.nombre_completo ||
              baseMatch?.nombre ||
              perfilData?.nombre_completo ||
              `${perfilData?.primer_nombre || ''} ${perfilData?.primer_apellido || ''}`.trim() ||
              authRes.user.email ||
              'Usuario';
            const nombreLimpio = rawNombre.replace(/\s+/g, ' ').trim();

            authUser = {
              id: authRes.user.id,
              nombre: nombreLimpio,
              email: authRes.user.email || emailParaAuth,
              rol: rolNombre === 'Administrador' ? 'Administrador' : 'Usuario',
              cargo:
                userMeta.cargo ||
                perfilData?.cargo_puesto ||
                baseMatch?.cargo ||
                (rolNombre === 'Administrador' ? 'Administrador de Proyecto' : 'Supervisor de Campo'),
            };
          }
        } catch (_) {}
      }

      // 2. Validar con Usuarios Base o Registrados
      if (!authUser) {
        const passUpper = passTrim.toUpperCase();
        if (usuariosBaseMap[cleanUser] && (passUpper === 'VAS-HINCAPIE' || passTrim === 'mariobros25')) {
          const uBase = usuariosBaseMap[cleanUser];
          authUser = {
            id: `base-${cleanUser}`,
            nombre: uBase.nombre,
            email: uBase.email,
            rol: uBase.rol,
            cargo: uBase.cargo,
          };
        } else if (usuarioPorUsername) {
          // Validar contraseña de usuario registrado por username o correo
          const passwordValida = usuarioPorUsername.password
            ? (usuarioPorUsername.password === passTrim || usuarioPorUsername.password.toUpperCase() === passTrim.toUpperCase())
            : (passTrim === 'mariobros25' || passTrim.toUpperCase() === 'MARIOBROS25');

          if (passwordValida) {
            if (usuarioPorUsername.estado === 'Suspendido' || usuarioPorUsername.activo === false) {
              showErrorToast('Su cuenta se encuentra suspendida. Contacte al administrador.');
              setIsSubmitting(false);
              return;
            }
            authUser = {
              id: usuarioPorUsername.id,
              nombre:
                usuarioPorUsername.nombre ||
                `${usuarioPorUsername.primer_nombre || ''} ${usuarioPorUsername.primer_apellido || ''}`.trim(),
              email: usuarioPorUsername.correo,
              rol: usuarioPorUsername.rol === 'Administrador' ? 'Administrador' : 'Usuario',
              cargo: usuarioPorUsername.cargo || 'Supervisor de Campo',
            };
          }
        }
      }

      // 3. Si NO se validaron las credenciales, BLOQUEAR ACCESO (como en DomunNet)
      if (!authUser) {
        setEmailError(true);
        setPasswordError(true);

        let attempts = 1;
        let lockUntil: number | null = null;
        try {
          const stored = localStorage.getItem('bitacora_failed_login_attempts');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.lockUntil && Date.now() >= parsed.lockUntil) {
              attempts = 1;
            } else {
              attempts = (parsed.attempts || 0) + 1;
            }
          }
        } catch {
          attempts = 1;
        }

        if (attempts >= 5) {
          lockUntil = Date.now() + 3600 * 1000; // 1 hora de bloqueo
          localStorage.setItem(
            'bitacora_failed_login_attempts',
            JSON.stringify({ attempts, lockUntil })
          );
          showErrorToast(
            'Demasiados intentos fallidos. Su cuenta está bloqueada temporalmente durante 1 hora.'
          );
        } else {
          localStorage.setItem(
            'bitacora_failed_login_attempts',
            JSON.stringify({ attempts, lockUntil: null })
          );
          showErrorToast(`Credenciales incorrectas. Intento ${attempts} de 5.`);
        }

        setIsSubmitting(false);
        return;
      }

      // Verificar si el usuario identificado está suspendido
      const userRegistrado = listUsuarios.find(
        (u: any) =>
          (u.correo && u.correo.toLowerCase() === authUser.email.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === cleanUser)
      );
      if (userRegistrado && (userRegistrado.estado === 'Suspendido' || userRegistrado.activo === false)) {
        showErrorToast('Su cuenta se encuentra suspendida. Contacte al administrador.');
        setIsSubmitting(false);
        return;
      }

      // 4. Credenciales correctas: limpiar intentos fallidos
      localStorage.removeItem('bitacora_failed_login_attempts');

      // Generar token JWT con contador de expiración (8 horas = 28800s)
      const expSeconds = Math.floor(Date.now() / 1000) + 28800;
      const headerStr = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadStr = btoa(
        JSON.stringify({
          id: authUser.id,
          email: authUser.email,
          rol: authUser.rol,
          exp: expSeconds,
        })
      );
      const sessionToken = `${headerStr}.${payloadStr}.sig`;

      // Registrar sesión de dispositivo (máx 2)
      const resRegistro = registrarSesionDispositivo({ id: authUser.id, email: authUser.email });
      if (!resRegistro.success && resRegistro.limiteAlcanzado) {
        setUsuarioParaDispositivos(authUser);
        setModalDispositivosOpen(true);
        setIsSubmitting(false);
        showErrorToast('Límite de 2 dispositivos alcanzado. Cierra una sesión previa para ingresar.');
        return;
      }

      // Registrar último acceso y contador de ingresos en bitacora_usuarios_lista
      const fechaAhora = new Date().toLocaleString('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      let usuarioActualizado = false;
      const nuevaListaUsuarios = listUsuarios.map((u: any) => {
        if (
          (u.correo && u.correo.toLowerCase() === authUser.email.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === cleanUser)
        ) {
          usuarioActualizado = true;
          return {
            ...u,
            ultimoAcceso: fechaAhora,
            contadorAccesos: (u.contadorAccesos || 0) + 1,
          };
        }
        return u;
      });

      if (!usuarioActualizado) {
        nuevaListaUsuarios.push({
          id: authUser.id,
          primer_nombre: authUser.nombre.split(' ')[0] || 'Usuario',
          primer_apellido: authUser.nombre.split(' ').slice(1).join(' ') || '',
          nombre: authUser.nombre,
          correo: authUser.email,
          username: cleanUser || authUser.email.split('@')[0],
          rol: authUser.rol,
          cargo: authUser.cargo,
          estado: 'Activo',
          fechaCreacion: '2026-01-01',
          ultimoAcceso: fechaAhora,
          contadorAccesos: 1,
        });
      }

      localStorage.setItem('bitacora_usuarios_lista', JSON.stringify(nuevaListaUsuarios));

      // Guardar cookies y perfil
      document.cookie = `bitacora_token=${sessionToken}; path=/; max-age=28800; SameSite=Lax`;
      document.cookie = `token=${sessionToken}; path=/; max-age=28800; SameSite=Lax`;
      localStorage.setItem('bitacora_user_profile', JSON.stringify(authUser));
      localStorage.setItem('bitacora_session_expiry', String(expSeconds * 1000));
      if (process.env.NEXT_PUBLIC_BUILD_TIME) {
        localStorage.setItem('bitacora_build_id', process.env.NEXT_PUBLIC_BUILD_TIME);
      }

      // Gestión de recordar cuentas
      if (rememberMe) {
        let accounts = [...rememberedAccounts].filter(
          (a) => a.username.toLowerCase() !== username.toLowerCase()
        );
        accounts.unshift({ username, password, role: authUser.rol });
        setRememberedAccounts(accounts);
        localStorage.setItem('bitacora_remembered_accounts', JSON.stringify(accounts));
      }

      showSuccessToast('¡Sesión iniciada correctamente!');

      // Redirección inmediata sin esperas (estilo DomunNet)
      window.location.replace('/dashboard');
    } catch (err: any) {
      showErrorToast('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none flex flex-col items-center justify-center bg-[#140B07]"
      style={{
        fontFamily: "'Poppins', sans-serif",
        touchAction: 'manipulation',
      }}
    >
      {/* Fondo de alta resolución precargado con máxima prioridad y fijado al viewport */}
      <div
        aria-hidden="true"
        className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
      >
        <Image
          src="/img.jpg"
          alt="Fondo Carretera"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-center pointer-events-none"
        />
        {/* Capa de contraste oscuro para máxima nitidez y legibilidad */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Contenedor principal centrado */}
      <div
        className="login-container relative z-10 flex flex-col items-center w-[90%] max-w-[310px]"
        style={{ transform: 'translateY(2%)' }}
      >
        {/* Logo DOMUN */}
        <div className="mb-3 animate-fadeIn">
          <Image
            src="/logo.png"
            alt="DOMUN Logo"
            width={400}
            height={440}
            priority
            style={{ width: 'auto', height: '58px' }}
            className="drop-shadow-lg"
          />
        </div>

        {/* Título */}
        <div className="mb-1 text-center animate-fadeIn" style={{ animationDelay: '0.02s' }}>
          <h1
            className="text-[22px] font-bold text-white leading-tight"
            style={{
              fontFamily: 'Poppins, sans-serif',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            Bitácora Electrónica
          </h1>
        </div>

        {/* Subtítulo */}
        <div className="mb-6 text-center animate-fadeIn" style={{ animationDelay: '0.04s' }}>
          <p
            className="text-[12px] font-light text-white/80"
            style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.02em' }}
          >
            Proyecto: Conexion VAS - Hincapie
          </p>
        </div>

        {/* Formulario de Login */}
        <form
          onSubmit={handleLogin}
          className="w-full animate-fadeIn"
          style={{ animationDelay: '0.06s' }}
        >
          {/* Input Usuario */}
          <div className="mb-[14px] relative">
            <LoginInput
              id="username"
              name="username"
              autoComplete="username"
              icon={<User size={16} strokeWidth={1.5} />}
              placeholder="Correo o Usuario"
              value={username}
              error={emailError}
              onChange={(e) => {
                setUsername(e.target.value);
                if (emailError) setEmailError(false);
              }}
              rightIcon={
                rememberedAccounts.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowRememberedDropdown(!showRememberedDropdown)}
                    className="text-white/60 hover:text-white transition-all p-1 focus:outline-none flex items-center justify-center"
                    title="Seleccionar usuario guardado"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={`transition-transform duration-200 ${
                        showRememberedDropdown ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>
                ) : undefined
              }
            />

            {/* Dropdown de usuarios recordados */}
            {showRememberedDropdown && rememberedAccounts.length > 0 && (
              <div
                className="absolute left-0 right-0 top-[42px] z-50 rounded-lg border border-white/20 bg-black/95 shadow-2xl backdrop-blur-md overflow-hidden max-h-[160px] overflow-y-auto animate-fadeIn"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-semibold text-white/60 tracking-wider flex justify-between items-center bg-black/40">
                  <span>Usuarios Guardados</span>
                  <span className="text-[9px] text-white/50">
                    {rememberedAccounts.length}
                  </span>
                </div>
                {rememberedAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectRememberedAccount(acc)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-white/15 ${
                      username.toLowerCase() === acc.username.toLowerCase()
                        ? 'bg-white/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <User size={13} className="text-white/70 shrink-0" />
                      <span className="text-[12px] text-white truncate font-medium">
                        {acc.username}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeRememberedAccount(acc.username, e)}
                      className="text-white/40 hover:text-red-400 p-1 transition-colors shrink-0"
                      title="Eliminar de recordados"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Contraseña */}
          <div className="mb-[10px]">
            <LoginInput
              id="password"
              name="password"
              autoComplete="current-password"
              inputRef={passwordInputRef}
              icon={<Lock size={16} strokeWidth={1.5} />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              error={passwordError}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              }
            />
          </div>

          {/* Opciones extra: Recordarme y Olvidaste tu contraseña */}
          <div className="mt-[8px] mb-[22px] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border border-white/50 bg-transparent cursor-pointer accent-white"
              />
              <span
                className="text-xs text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Recuérdame
              </span>
            </label>

            <button
              type="button"
              onClick={() => setIsRecoveryOpen(true)}
              className="text-xs text-white hover:text-white/80 underline transition-colors cursor-pointer focus:outline-none font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Login Button */}
          <LoginButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </LoginButton>
        </form>
      </div>

      {/* Modal de recuperación de contraseña */}
      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />

      {/* Modal de Dispositivos Conectados en Login */}
      {modalDispositivosOpen && usuarioParaDispositivos && (
        <ModalDispositivosConectados
          isOpen={modalDispositivosOpen}
          onClose={() => setModalDispositivosOpen(false)}
          usuarioCorreo={usuarioParaDispositivos.email}
          usuarioNombre={usuarioParaDispositivos.nombre}
          onSesionCerrada={() => {
            showSuccessToast('Dispositivo liberado. Ahora puedes iniciar sesión.');
            setModalDispositivosOpen(false);
          }}
        />
      )}
    </div>
  );
}
