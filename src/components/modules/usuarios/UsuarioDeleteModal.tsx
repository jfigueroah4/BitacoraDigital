'use client';

import React from 'react';
import { Usuario } from '@/types/usuario';
import { AccionEstadoModal } from '@/components/ui/AccionEstadoModal';

interface UsuarioDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accion: 'eliminar' | 'suspender' | 'activar') => void;
  usuario?: Usuario;
  modoModal?: 'todos' | 'activar' | 'eliminar' | 'suspender';
}

export function UsuarioDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  usuario,
  modoModal = 'todos',
}: UsuarioDeleteModalProps) {
  const isSuspended = usuario?.estado === 'Suspendido' || (usuario as any)?.activo === false;
  const nombreCompleto = usuario?.nombre || `${usuario?.primer_nombre || ''} ${usuario?.primer_apellido || ''}`.trim() || 'Usuario';

  return (
    <AccionEstadoModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      titulo="Acción sobre Usuario"
      nombreItem={nombreCompleto}
      subtitulo1={usuario?.correo}
      subtitulo2={usuario?.rol ? `Rol: ${usuario.rol}` : undefined}
      isSuspended={isSuspended}
      modoModal={modoModal}
    />
  );
}
