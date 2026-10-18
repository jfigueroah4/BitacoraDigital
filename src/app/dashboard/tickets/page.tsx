'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mail,
  Phone,
  KeyRound,
  ShieldAlert,
  Copy,
  MessageCircle,
  User,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

interface TicketMessage {
  id: string;
  author: string;
  role: 'user' | 'admin';
  message: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: 'abierto' | 'en_revision' | 'en_progreso' | 'cerrado';
  category: 'contrasena' | 'reportes' | 'funcionalidad' | 'otro';
  createdBy: string;
  createdByRole?: string;
  createdByEmail?: string;
  createdByPhone?: string;
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
}

const getFechaReciente = (horasMenos = 0) => {
  const d = new Date(Date.now() - horasMenos * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: '1',
    title: 'Solicitud de recuperación de contraseña',
    status: 'abierto',
    category: 'contrasena',
    createdBy: 'Luis Arriaga',
    createdByRole: 'IngenieroResidente',
    createdByEmail: 'luis.arriaga@bitacoradigital.com',
    createdByPhone: '+502 4589 1234',
    assignedTo: 'Administrador / Daniel Figueroa',
    createdAt: getFechaReciente(2),
    messages: [
      {
        id: '1',
        author: 'Luis Arriaga',
        role: 'user',
        message: 'No puedo ingresar con mi contraseña actual. Solicito apoyo para restablecerla.',
        timestamp: getFechaReciente(2),
      },
      {
        id: '2',
        author: 'Daniel Figueroa',
        role: 'admin',
        message: 'Se ha generado un enlace de recuperación. Te proporciono una clave temporal.',
        timestamp: getFechaReciente(1),
      },
    ],
  },
  {
    id: '2',
    title: 'Error al generar reporte de bitácora',
    status: 'en_revision',
    category: 'reportes',
    createdBy: 'Marco Estrada',
    createdByRole: 'Administrador',
    createdByEmail: 'marco.estrada@bitacoradigital.com',
    createdByPhone: '+502 5555 9988',
    assignedTo: 'Administrador / Daniel Figueroa',
    createdAt: getFechaReciente(5),
    messages: [
      {
        id: '1',
        author: 'Marco Estrada',
        role: 'user',
        message: 'El PDF del informe abre, pero necesito confirmar si incluye todas las fotografías seleccionadas del tramo.',
        timestamp: getFechaReciente(5),
      },
    ],
  },
  {
    id: '3',
    title: 'Restablecimiento de credenciales de acceso',
    status: 'abierto',
    category: 'contrasena',
    createdBy: 'Roberto Díaz Cortés',
    createdByRole: 'Laboratorista',
    createdByEmail: 'roberto.diaz@bitacoradigital.com',
    createdByPhone: '+502 7456 7890',
    assignedTo: 'Administrador / Daniel Figueroa',
    createdAt: getFechaReciente(1),
    messages: [
      {
        id: '1',
        author: 'Roberto Díaz Cortés',
        role: 'user',
        message: 'Buen día, solicito una contraseña temporal para ingresar los ensayos de laboratorio correspondientes a esta semana.',
        timestamp: getFechaReciente(1),
      },
    ],
  },
  {
    id: '4',
    title: 'Solicitud de contraseña para cuenta gerencial',
    status: 'abierto',
    category: 'contrasena',
    createdBy: 'Laura Pérez López',
    createdByRole: 'Gerencia',
    createdByEmail: 'laura.perez@bitacoradigital.com',
    createdByPhone: '+502 7654 3210',
    assignedTo: 'Administrador / Daniel Figueroa',
    createdAt: getFechaReciente(0.5),
    messages: [
      {
        id: '1',
        author: 'Laura Pérez López',
        role: 'user',
        message: 'Solicito el restablecimiento de las credenciales de acceso para la cuenta gerencial.',
        timestamp: getFechaReciente(0.5),
      },
    ],
  },
];

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(INITIAL_TICKETS[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Paginación (3 tickets por página idéntico a DomunNet)
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 3;

  // Formulario nuevo ticket
  const [formData, setFormData] = useState({
    subject: '',
    category: 'contrasena' as SupportTicket['category'],
    message: '',
  });

  // Despacho de contraseña temporal
  const [contrasenaTemporal, setContrasenaTemporal] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [correoEnvio, setCorreoEnvio] = useState('');
  const [telefonoEnvio, setTelefonoEnvio] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bitacora_support_tickets_clean');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickets(parsed);
          setSelectedTicket(parsed[0]);
          return;
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setCorreoEnvio(selectedTicket.createdByEmail || '');
      setTelefonoEnvio(selectedTicket.createdByPhone || '');
      setContrasenaTemporal(generarContrasenaSegura());
      setMostrarContrasena(false);
    }
  }, [selectedTicket?.id]);

  const saveTickets = (updated: SupportTicket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem('bitacora_support_tickets_clean', JSON.stringify(updated));
    } catch (_) {}
  };

  function generarContrasenaSegura() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Bitacora#${rand}2026!`;
  }

  const copiarContrasena = () => {
    if (!contrasenaTemporal) return;
    navigator.clipboard.writeText(contrasenaTemporal);
    showSuccessToast('Contraseña temporal copiada al portapapeles');
  };

  const handleEnviarPorCorreo = () => {
    if (!selectedTicket || !correoEnvio.trim()) {
      showErrorToast('Ingresa un correo electrónico válido.');
      return;
    }
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const msg = `🔐 [Credenciales Enviadas por Correo]
Se ha generado la nueva contraseña temporal:
• Destinatario: ${selectedTicket.createdBy}
• Correo: ${correoEnvio.trim()}
• Contraseña temporal: ${contrasenaTemporal.trim()}`;

    const updatedMessages: TicketMessage[] = [
      ...selectedTicket.messages,
      {
        id: Date.now().toString(),
        author: 'Daniel Figueroa (Admin)',
        role: 'admin',
        message: msg,
        timestamp: nowStr,
      },
    ];

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: 'en_progreso',
      createdByEmail: correoEnvio.trim(),
      messages: updatedMessages,
    };

    const actualizados = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    saveTickets(actualizados);
    setSelectedTicket(updatedTicket);
    showSuccessToast(`Contraseña enviada al correo ${correoEnvio}`);
  };

  const handleEnviarPorWhatsApp = () => {
    if (!selectedTicket || !telefonoEnvio.trim()) {
      showErrorToast('Ingresa un número de WhatsApp.');
      return;
    }
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const msg = `📱 [Credenciales Enviadas por WhatsApp]
Mensaje despachado al teléfono ${telefonoEnvio.trim()}:
• Destinatario: ${selectedTicket.createdBy}
• Contraseña temporal: ${contrasenaTemporal.trim()}`;

    const updatedMessages: TicketMessage[] = [
      ...selectedTicket.messages,
      {
        id: Date.now().toString(),
        author: 'Daniel Figueroa (Admin)',
        role: 'admin',
        message: msg,
        timestamp: nowStr,
      },
    ];

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: 'en_progreso',
      createdByPhone: telefonoEnvio.trim(),
      messages: updatedMessages,
    };

    const actualizados = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    saveTickets(actualizados);
    setSelectedTicket(updatedTicket);
    showSuccessToast(`Contraseña enviada por WhatsApp a ${telefonoEnvio}`);
  };

  // Filtrado
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.createdBy.toLowerCase().includes(q) ||
        t.messages.some((m) => m.message.toLowerCase().includes(q));

      const matchCat = filtroCategoria === 'todos' || t.category === filtroCategoria;
      const matchEst = filtroEstado === 'todos' || t.status === filtroEstado;

      return matchBusqueda && matchCat && matchEst;
    });
  }, [tickets, busqueda, filtroCategoria, filtroEstado]);

  const totalPaginas = Math.ceil(ticketsFiltrados.length / registrosPorPagina) || 1;

  const ticketsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return ticketsFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [ticketsFiltrados, paginaActual, registrosPorPagina]);

  const openTicketsCount = tickets.filter((t) => t.status === 'abierto').length;
  const progressTicketsCount = tickets.filter((t) => t.status === 'en_progreso' || t.status === 'en_revision').length;
  const closedTicketsCount = tickets.filter((t) => t.status === 'cerrado').length;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      showErrorToast('Por favor completa todos los campos.');
      return;
    }

    const nuevoTicket: SupportTicket = {
      id: String(Date.now()).slice(-4),
      title: formData.subject.trim(),
      category: formData.category,
      status: 'abierto',
      createdBy: 'Daniel Figueroa',
      createdByRole: 'Administrador',
      createdByEmail: 'admin@bitacoradigital.com',
      createdByPhone: '+502 56252922',
      assignedTo: 'Soporte Técnico',
      createdAt: getFechaReciente(0),
      messages: [
        {
          id: Date.now().toString(),
          author: 'Daniel Figueroa',
          role: 'user',
          message: formData.message.trim(),
          timestamp: getFechaReciente(0),
        },
      ],
    };

    const actualizados = [nuevoTicket, ...tickets];
    saveTickets(actualizados);
    setSelectedTicket(nuevoTicket);
    setFormData({ subject: '', category: 'contrasena', message: '' });
    setShowCreateForm(false);
    showSuccessToast('Ticket de soporte creado');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const updatedMessages: TicketMessage[] = [
      ...selectedTicket.messages,
      {
        id: Date.now().toString(),
        author: 'Daniel Figueroa',
        role: 'admin',
        message: newMessage.trim(),
        timestamp: nowStr,
      },
    ];

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      messages: updatedMessages,
    };

    const actualizados = tickets.map((t) => (t.id === selectedTicket.id ? updatedTicket : t));
    saveTickets(actualizados);
    setSelectedTicket(updatedTicket);
    setNewMessage('');
    showSuccessToast('Respuesta enviada');
  };

  const handleChangeStatus = (nuevoEstado: SupportTicket['status']) => {
    if (!selectedTicket) return;
    const actualizados = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, status: nuevoEstado } : t
    );
    saveTickets(actualizados);
    setSelectedTicket((prev) => (prev ? { ...prev, status: nuevoEstado } : null));
    showSuccessToast(`Estado cambiado a ${formatStatus(nuevoEstado)}`);
  };

  const handleDeleteTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const actualizados = tickets.filter((t) => t.id !== id);
    saveTickets(actualizados);
    if (selectedTicket?.id === id) {
      setSelectedTicket(actualizados[0] || null);
    }
    showSuccessToast('Ticket eliminado');
  };

  function formatStatus(status: SupportTicket['status']) {
    switch (status) {
      case 'abierto':
        return 'Abierto';
      case 'en_revision':
        return 'En revisión';
      case 'en_progreso':
        return 'En progreso';
      case 'cerrado':
        return 'Resuelto / Cerrado';
    }
  }

  // Estilos limpios idénticos a DomunNet
  function getStatusBadge(status: SupportTicket['status']) {
    switch (status) {
      case 'abierto':
        return 'bg-red-100 text-red-800 ring-red-200';
      case 'en_revision':
        return 'bg-amber-100 text-amber-800 ring-amber-200';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 ring-blue-200';
      case 'cerrado':
        return 'bg-gray-200 text-gray-700 ring-gray-300 font-semibold';
    }
  }

  function getStatusIcon(status: SupportTicket['status']) {
    switch (status) {
      case 'abierto':
        return <AlertCircle size={12} />;
      case 'en_revision':
      case 'en_progreso':
        return <Clock size={12} />;
      case 'cerrado':
        return <CheckCircle2 size={12} />;
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      <TopBar bitacoraNombre="BITÁCORA VAI - ANCOPIE • TICKETS" />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-4">
        {/* Header con botón Volver y Crear Ticket */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-white rounded-xl transition-all text-gray-700 bg-white/70 border border-gray-200 shadow-2xs cursor-pointer"
              title="Volver al Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                Centro de Tickets y Soporte
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Atención a incidentes, restablecimiento de contraseñas y consultas técnicas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            {showCreateForm ? <X size={15} /> : <Plus size={15} strokeWidth={2.5} />}
            <span>{showCreateForm ? 'Cerrar Formulario' : 'Nuevo Ticket'}</span>
          </button>
        </div>

        {/* Tarjetas de Resumen idénticas a DomunNet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Tickets</p>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">{tickets.length}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Abiertos</p>
              <h3 className="text-xl font-black text-red-600 mt-0.5">{openTicketsCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F4ECE6] text-red-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">En Proceso</p>
              <h3 className="text-xl font-black text-blue-600 mt-0.5">{progressTicketsCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Resueltos</p>
              <h3 className="text-xl font-black text-gray-700 mt-0.5">{closedTicketsCount}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Modal / Formulario Desplegable para Crear Ticket */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Registrar Nueva Solicitud o Ticket</h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Asunto o Título del Ticket <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Restablecimiento de credenciales de acceso"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Categoría del Ticket
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219] cursor-pointer"
                  >
                    <option value="contrasena">Recuperación de Contraseña</option>
                    <option value="reportes">Reportes y Folios PDF</option>
                    <option value="funcionalidad">Acceso y Permisos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Descripción o Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe la consulta o incidencia con el mayor detalle posible..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#3B2219] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barra de Filtros limpia (Search con pl-9!) */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-100 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] sm:max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por asunto, autor o mensaje..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3B2219] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setPaginaActual(1);
              }}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white outline-none cursor-pointer focus:border-[#3B2219]"
            >
              <option value="todos">Todas las categorías</option>
              <option value="contrasena">Contraseña</option>
              <option value="reportes">Reportes</option>
              <option value="funcionalidad">Acceso / Permisos</option>
              <option value="otro">Otro</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white outline-none cursor-pointer focus:border-[#3B2219]"
            >
              <option value="todos">Todos los estados</option>
              <option value="abierto">Abiertos</option>
              <option value="en_revision">En revisión</option>
              <option value="en_progreso">En progreso</option>
              <option value="cerrado">Resueltos / Cerrados</option>
            </select>
          </div>
        </div>

        {/* Panel Dividido: Lista a la izquierda (3 por página) + Detalle a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Columna Izquierda: Lista de Tickets */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="space-y-2.5 flex-1">
              {ticketsPaginados.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center text-xs text-gray-400">
                  No se encontraron tickets con los filtros aplicados.
                </div>
              ) : (
                ticketsPaginados.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#3B2219] shadow-sm ring-1 ring-[#3B2219]/20'
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          <span>{formatStatus(ticket.status)}</span>
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <span>{ticket.createdAt.slice(0, 10)}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTicket(ticket.id, e)}
                            className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                            title="Eliminar ticket"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">
                        {ticket.title}
                      </h4>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2.5">
                        {ticket.messages[0]?.message || 'Sin mensaje inicial'}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium truncate">
                          <User size={12} className="text-[#3B2219]" />
                          <span>{ticket.createdBy}</span>
                        </div>
                        <span className="font-semibold text-gray-500">
                          {ticket.messages.length} mensaje{ticket.messages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación de Tickets (3 por página) */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs text-xs text-gray-600">
                <span className="text-[11px]">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalle y Chat del Ticket Seleccionado */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-col overflow-hidden min-h-[500px]">
            {selectedTicket ? (
              <>
                {/* Header del Ticket */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                        selectedTicket.status
                      )}`}
                    >
                      {getStatusIcon(selectedTicket.status)}
                      <span>{formatStatus(selectedTicket.status)}</span>
                    </span>

                    {/* Selector de Estado */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Cambiar Estado:
                      </span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleChangeStatus(e.target.value as any)}
                        className="px-2.5 py-1 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 outline-none cursor-pointer focus:border-[#3B2219]"
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_revision">En revisión</option>
                        <option value="en_progreso">En progreso</option>
                        <option value="cerrado">Resuelto / Cerrado</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {selectedTicket.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span>
                      <strong>Autor:</strong> {selectedTicket.createdBy} ({selectedTicket.createdByRole || 'Usuario'})
                    </span>
                    {selectedTicket.createdByEmail && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Mail size={12} className="text-gray-400" />
                        {selectedTicket.createdByEmail}
                      </span>
                    )}
                    {selectedTicket.createdByPhone && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        {selectedTicket.createdByPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Despacho de Contraseña Temporal (Idéntico a DomunNet) */}
                {selectedTicket.category === 'contrasena' && (
                  <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <KeyRound size={15} className="text-[#3B2219]" />
                      <span>Generar y Despachar Contraseña Temporal</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <input
                          type={mostrarContrasena ? 'text' : 'password'}
                          value={contrasenaTemporal}
                          readOnly
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 outline-none pr-8 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarContrasena(!mostrarContrasena)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                        >
                          {mostrarContrasena ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={copiarContrasena}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleEnviarPorCorreo}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#3B2219] hover:bg-[#2A1710] text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Mail size={13} />
                        <span>Enviar por Correo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleEnviarPorWhatsApp}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Phone size={13} />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensajes del Ticket */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-white">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.role === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                          <span className="font-semibold text-gray-700">{msg.author}</span>
                          <span>&bull;</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isAdmin
                              ? 'bg-gray-100 text-gray-900 border border-gray-200/80 rounded-tr-none'
                              : 'bg-[#F4ECE6]/70 text-gray-900 border border-red-100 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Área de Respuesta */}
                <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/60 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta a este ticket..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 bg-white outline-none focus:border-[#3B2219]"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B2219] hover:bg-[#2A1710] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer active:scale-95"
                  >
                    <Send size={14} />
                    <span className="hidden sm:inline">Responder</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 text-xs">
                <MessageCircle size={32} className="mb-2 text-gray-300" />
                <span>Selecciona un ticket de la lista para ver la conversación.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

