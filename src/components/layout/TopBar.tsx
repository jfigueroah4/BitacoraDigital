'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  User,
  LogOut,
  ChevronDown,
  Users,
  HelpCircle,
  Ticket,
  FileText,
  Calendar,
  LayoutDashboard,
  Shield,
  Laptop,
} from 'lucide-react';
import { UserProfile } from '@/types/bitacora';
import { MESES_NOMBRES } from '@/lib/mockData';
import { showSuccessToast } from '@/components/ui/Toast';
import ModalDispositivosConectados from '@/components/modals/ModalDispositivosConectados';
import { getOrCreateDeviceId } from '@/lib/services/sesiones';

interface TopBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  userProfile?: UserProfile | null;
  bitacoraNombre?: string;
  seccion?: string;
  onVolverInicio?: () => void;
}

interface SearchItem {
  id: string;
  name: string;
  path: string;
  category: string;
  detail?: string;
  keywords: string[];
}

const systemRoutes: SearchItem[] = [
  // General & Bitácora
  {
    id: 'route-dashboard',
    name: 'Bitácora de Obra (Inicio)',
    path: '/dashboard',
    category: 'Bitácora',
    detail: 'Meses y calendario de obra',
    keywords: ['inicio', 'bitácora', 'obra', 'meses', 'folios', 'calendario', 'dashboard'],
  },

  // Administración & Usuarios
  {
    id: 'route-usuarios',
    name: 'Gestión de Usuarios',
    path: '/dashboard/usuarios',
    category: 'Administración',
    detail: 'Personal, roles y accesos',
    keywords: ['usuarios', 'personal', 'cuentas', 'empleados', 'accesos', 'administradores'],
  },
  {
    id: 'route-roles',
    name: 'Roles y Permisos',
    path: '/dashboard/roles',
    category: 'Administración',
    detail: 'Niveles de seguridad del sistema',
    keywords: ['roles', 'permisos', 'seguridad', 'niveles', 'privilegios'],
  },

  // Soporte y Ayuda
  {
    id: 'route-tickets',
    name: 'Tickets de Soporte',
    path: '/dashboard/tickets',
    category: 'Soporte',
    detail: 'Gestión de incidencias y solicitudes',
    keywords: ['tickets', 'soporte', 'incidencias', 'solicitudes', 'atención', 'ayuda'],
  },
  {
    id: 'route-soporte',
    name: 'Centro de Ayuda / Soporte',
    path: '/dashboard/soporte',
    category: 'Soporte',
    detail: 'Manuales y contacto técnico',
    keywords: ['soporte', 'ayuda', 'asistencia', 'contacto', 'faq', 'preguntas frecuentes'],
  },

  // Cuenta
  {
    id: 'route-perfil',
    name: 'Mi Perfil de Usuario',
    path: '/dashboard/perfil',
    category: 'Cuenta',
    detail: 'Datos personales y contraseña',
    keywords: ['mi perfil', 'cuenta', 'contraseña', 'datos personales', 'usuario'],
  },
];

export default function TopBar({
  searchQuery = '',
  onSearchChange,
  userProfile,
  bitacoraNombre = 'Proyecto: Conexion VAS - Hincapie',
  seccion,
  onVolverInicio,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [modalDispositivosOpen, setModalDispositivosOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(userProfile || null);

  const isAdmin = useMemo(() => {
    const rol = (currentUser?.rol || '').toLowerCase().trim();
    return rol.includes('admin');
  }, [currentUser]);

  // Indicador dinámico de Proyecto (superior) y Sección (inferior)
  const { nombreProyecto, seccionMostrada } = useMemo(() => {
    let proyecto = 'Proyecto: Conexion VAS – Hincapie';
    let seccionFinal = seccion || '';

    if (bitacoraNombre) {
      if (bitacoraNombre.includes('•')) {
        const partes = bitacoraNombre.split('•').map((s) => s.trim());
        proyecto = partes[0] || proyecto;
        if (!seccionFinal && partes[1]) {
          seccionFinal = partes[1];
        }
      } else {
        proyecto = bitacoraNombre;
      }
    }

    if (!seccionFinal) {
      if (pathname.includes('/dashboard/usuarios')) {
        seccionFinal = 'Gestión de Usuarios';
      } else if (pathname.includes('/dashboard/roles')) {
        seccionFinal = 'Roles y Permisos';
      } else if (pathname.includes('/dashboard/tickets')) {
        seccionFinal = 'Tickets de Soporte';
      } else if (pathname.includes('/dashboard/soporte')) {
        seccionFinal = 'Soporte Técnico';
      } else if (pathname.includes('/dashboard/perfil')) {
        seccionFinal = 'Mi Perfil';
      } else {
        seccionFinal = 'Bitácora General';
      }
    }

    return {
      nombreProyecto: proyecto,
      seccionMostrada: seccionFinal,
    };
  }, [pathname, bitacoraNombre, seccion]);

  // Search state similar to DomunNet
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [dynamicItems, setDynamicItems] = useState<SearchItem[]>([]);

  // Keep internalQuery in sync if parent updates prop
  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  // Verificación reactiva de sesión activa en vivo (cierra sesión remota si un admin o el usuario la desconectó)
  useEffect(() => {
    if (!currentUser?.email) return;

    const verificarSesionViva = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const res = await fetch(`/api/sesiones?correo=${encodeURIComponent(currentUser.email)}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.sesiones) && data.sesiones.length > 0) {
            const miSesionExiste = data.sesiones.some((s: any) => s.id === deviceId);
            if (!miSesionExiste) {
              localStorage.removeItem('bitacora_user_profile');
              localStorage.removeItem('bitacora_sesiones_activas');
              router.push('/login?motivo=sesion_cerrada');
            }
          }
        }
      } catch (_) {}
    };

    const interval = setInterval(verificarSesionViva, 12000);
    return () => clearInterval(interval);
  }, [currentUser?.email, router]);

  useEffect(() => {
    if (userProfile) {
      setCurrentUser(userProfile);
    } else {
      try {
        const stored = localStorage.getItem('bitacora_user_profile');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (_) {}
    }
  }, [userProfile]);

  // Cargar elementos dinámicos (Meses, Folios reales y Usuarios)
  const cargarElementosDinamicos = () => {
    try {
      const items: SearchItem[] = [];

      // 1. Meses del año
      MESES_NOMBRES.forEach((nombreMes, idx) => {
        const mesNum = idx + 1;
        items.push({
          id: `mes-${mesNum}`,
          name: `Mes de ${nombreMes} 2026`,
          path: `/dashboard`,
          category: 'Meses',
          detail: `Bitácora ${nombreMes}`,
          keywords: [nombreMes.toLowerCase(), `mes ${mesNum}`, '2026', 'meses'],
        });
      });

      // 2. Folios y documentos guardados
      const storedDocs = localStorage.getItem('bitacora_documentos_lista');
      if (storedDocs) {
        try {
          const parsed = JSON.parse(storedDocs);
          if (Array.isArray(parsed)) {
            parsed.forEach((doc: any, i: number) => {
              if (doc && doc.titulo) {
                const mesNom = MESES_NOMBRES[(doc.mes || 1) - 1] || '';
                items.push({
                  id: `doc-${doc.id || i}`,
                  name: `Folio: ${doc.titulo}`,
                  path: `/dashboard`,
                  category: 'Folio Bitácora',
                  detail: `Día ${doc.dia} de ${mesNom} • ${doc.subidoPor || 'Admin'}`,
                  keywords: [
                    doc.titulo.toLowerCase(),
                    doc.descripcion?.toLowerCase() || '',
                    `dia ${doc.dia}`,
                    mesNom.toLowerCase(),
                    doc.subidoPor?.toLowerCase() || '',
                    'folio',
                  ],
                });
              }
            });
          }
        } catch (_) {}
      }

      // 3. Usuarios registrados (solo accesible para Administradores)
      if (isAdmin) {
        const storedUsers = localStorage.getItem('bitacora_usuarios_lista');
        if (storedUsers) {
          try {
            const parsedU = JSON.parse(storedUsers);
            if (Array.isArray(parsedU)) {
              parsedU.forEach((u: any, i: number) => {
                if (u && (u.nombre || u.correo)) {
                  items.push({
                    id: `usr-${u.id || i}`,
                    name: `Usuario: ${u.nombre || u.correo} (${u.rol || 'Usuario'})`,
                    path: `/dashboard/usuarios`,
                    category: 'Usuarios',
                    detail: u.correo || u.cargo || '',
                    keywords: [
                      u.nombre?.toLowerCase() || '',
                      u.correo?.toLowerCase() || '',
                      u.rol?.toLowerCase() || '',
                      u.cargo?.toLowerCase() || '',
                    ],
                  });
                }
              });
            }
          } catch (_) {}
        }
      }

      setDynamicItems(items);
    } catch (_) {}
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('#profile-menu')) {
        setProfileOpen(false);
      }
      if (!target.closest('#search-bar-container')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCerrarSesion = () => {
    setProfileOpen(false);
    try {
      localStorage.removeItem('bitacora_user_profile');
      localStorage.removeItem('bitacora_session_expiry');
      document.cookie = 'bitacora_token=; path=/; max-age=0';
      document.cookie = 'token=; path=/; max-age=0';
    } catch (_) {}
    showSuccessToast('Sesión cerrada correctamente');
    setTimeout(() => {
      window.location.href = '/login';
    }, 250);
  };

  const handleLogoClick = () => {
    if (onVolverInicio) {
      onVolverInicio();
    }
    router.push('/dashboard');
  };

  const getInitials = (nombre?: string) => {
    if (!nombre) return 'DF';
    const clean = nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (clean[0] || 'U').toUpperCase();
  };

  // Filtrado de sugerencias estilo DomunNet con límites estrictos entre Administrador y Usuario normal
  const suggestions = useMemo(() => {
    const q = internalQuery.trim().toLowerCase();
    if (!q) return [];

    let availableRoutes = systemRoutes;
    let availableDynamic = dynamicItems;

    // Si NO es administrador, ocultar páginas y módulos administrativos, y catálogo de usuarios
    if (!isAdmin) {
      availableRoutes = systemRoutes.filter(
        (item) => item.category !== 'Administración' && !item.path.includes('/usuarios') && !item.path.includes('/roles')
      );
      availableDynamic = dynamicItems.filter(
        (item) => item.category !== 'Usuarios'
      );
    }

    const allItems = [...availableRoutes, ...availableDynamic];
    return allItems.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchDetail = item.detail ? item.detail.toLowerCase().includes(q) : false;
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchName || matchCategory || matchDetail || matchKeywords;
    });
  }, [internalQuery, dynamicItems, isAdmin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalQuery(val);
    onSearchChange?.(val);
    setShowSearchDropdown(Boolean(val.trim()));
  };

  const handleInputFocus = () => {
    cargarElementosDinamicos();
    if (internalQuery.trim()) {
      setShowSearchDropdown(true);
    }
  };

  const handleSuggestionClick = (path: string) => {
    setShowSearchDropdown(false);
    setInternalQuery('');
    onSearchChange?.('');
    router.push(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0].path);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  const handleClearSearch = () => {
    setInternalQuery('');
    onSearchChange?.('');
    setShowSearchDropdown(false);
  };

  return (
    <header className="relative z-50 flex items-center justify-between h-[48px] sm:h-[52px] bg-white border-b border-gray-200/80 px-3 sm:px-6 shrink-0 w-full shadow-2xs">
      {/* Left Section: Bitacora Branding / Title */}
      <div
        onClick={handleLogoClick}
        className="flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer group"
        title="Regresar al inicio"
      >
        <div className="flex items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt="DOMUM Logo"
            width={28}
            height={28}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight select-none min-w-0">
          <span className="text-[10px] sm:text-[11px] text-[#8898AA] font-semibold tracking-wide truncate">
            {nombreProyecto}
          </span>
          <span className="text-[13px] sm:text-[14.5px] text-[#0F172A] font-bold tracking-tight truncate max-w-[220px] sm:max-w-none group-hover:text-[#3B2219] transition-colors leading-tight">
            {seccionMostrada}
          </span>
        </div>
      </div>

      {/* Center Section: Search Bar estilo DomunNet con Dropdown */}
      <div id="search-bar-container" ref={searchContainerRef} className="flex-1 mx-2 sm:mx-8 max-w-[440px] min-w-0 relative">
        <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/70 transition-colors rounded-full px-3 py-0.5 h-[30px]">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={
              isAdmin
                ? "Buscar folios, meses, usuarios, páginas..."
                : "Buscar folios, meses, fechas, páginas..."
            }
            value={internalQuery}
            onFocus={handleInputFocus}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="search-bar-input bg-transparent outline-none text-[10.5px] w-full min-w-0 placeholder:text-[10.5px] placeholder-gray-400 text-gray-800 font-poppins"
          />
          {internalQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-700 text-xs px-1 cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdown de Sugerencias Estilo DomunNet */}
        {showSearchDropdown && (
          <div className="search-suggestions absolute top-[36px] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-[260px] overflow-y-auto font-poppins animate-fadeIn">
            {suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSuggestionClick(item.path)}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 transition-colors text-[10.5px] text-gray-700 flex items-center justify-between cursor-pointer border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </span>
                    </div>
                    {item.detail && (
                      <span className="text-gray-400 text-[8.5px] shrink-0 ml-2 truncate max-w-[130px]">
                        {item.detail}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-center text-[10.5px] text-gray-400 font-medium">
                No se encontraron resultados para &ldquo;{internalQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section: User Profile & Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Profile Menu */}
        <div id="profile-menu" className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 bg-[#3B2219] rounded-full flex items-center justify-center text-white shadow-xs shrink-0 select-none">
              <span className="text-[11px] font-bold tracking-tight">
                {getInitials(currentUser?.nombre)}
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[11px] font-semibold text-gray-800">
                {currentUser?.nombre || 'Usuario'}
              </span>
              <span className="text-[9px] text-gray-400">
                {currentUser?.rol || 'Usuario'}
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn font-poppins">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                <p className="text-[12px] font-bold text-gray-900 leading-tight">
                  {currentUser?.nombre || 'Usuario'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                  {currentUser?.email || 'admin@bitacoradigital.com'}
                </p>
                <div className="mt-1.5">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-semibold rounded bg-[#F4ECE6] text-[#3B2219]">
                    Rol: {currentUser?.rol || 'Usuario'}
                  </span>
                </div>
              </div>

              {/* Secciones del Dropdown */}
              <div className="py-1">
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-700 font-medium"
                >
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span>Mi perfil</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setModalDispositivosOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-700 font-medium w-full text-left cursor-pointer"
                >
                  <Laptop size={13} className="text-gray-400 shrink-0" />
                  <span>Dispositivos conectados</span>
                </button>

                {/* Usuarios y Roles - Solo Administradores */}
                {isAdmin && (
                  <Link
                    href="/dashboard/usuarios"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-700 font-medium"
                  >
                    <Users size={13} className="text-gray-400 shrink-0" />
                    <span>Usuarios y Roles</span>
                  </Link>
                )}

                <Link
                  href="/dashboard/tickets"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-700 font-medium"
                >
                  <Ticket size={13} className="text-gray-400 shrink-0" />
                  <span>Tickets de Soporte</span>
                </Link>

                <hr className="border-gray-100 my-1 mx-3" />

                <Link
                  href="/dashboard/soporte"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-700 font-medium"
                >
                  <HelpCircle size={13} className="text-gray-400 shrink-0" />
                  <span>Soporte</span>
                </Link>

                <hr className="border-gray-100 my-1 mx-3" />

                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left text-[11px] text-[#D53E0F] font-semibold cursor-pointer"
                >
                  <LogOut size={13} className="text-[#D53E0F] shrink-0" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Dispositivos Conectados */}
      {modalDispositivosOpen && currentUser && (
        <ModalDispositivosConectados
          isOpen={modalDispositivosOpen}
          onClose={() => setModalDispositivosOpen(false)}
          usuarioCorreo={currentUser.email}
          usuarioNombre={currentUser.nombre}
        />
      )}
    </header>
  );
}
