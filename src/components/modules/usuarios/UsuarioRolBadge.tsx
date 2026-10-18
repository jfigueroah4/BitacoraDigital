'use client';

import React from 'react';
import { RolUsuario } from '@/types/usuario';

interface UsuarioRolBadgeProps {
  rol: RolUsuario | string | null;
}

const rolLabels: Record<string, string> = {
  Administrador: 'Administrador',
  Gerencia: 'Gerencia',
  IngenieroResidente: 'Ingeniero Residente',
  Laboratorista: 'Laboratorista',
  AuxiliarDeCampo: 'Auxiliar de Campo',
  Contratante: 'Contratante',
  Supervisor: 'Supervisor',
  Usuario: 'Usuario',
};

export function UsuarioRolBadge({ rol }: UsuarioRolBadgeProps) {
  if (!rol) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
        Sin rol asignado
      </span>
    );
  }
  const label = rolLabels[rol] || rol;

  return (
    <span className="text-gray-700 font-medium text-[11px]">
      {label}
    </span>
  );
}
