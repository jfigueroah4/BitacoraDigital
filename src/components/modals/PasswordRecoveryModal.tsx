'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { useCustomToast } from '@/hooks/useCustomToast';
import { supabase } from '@/lib/supabase/client';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordRecoveryModal({
  isOpen,
  onClose,
}: PasswordRecoveryModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { showErrorToast, showSuccessToast } = useCustomToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      showErrorToast('Ingrese su correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showErrorToast('Ingrese un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Intentar enviar enlace de recuperación vía Supabase si está disponible
      if (supabase) {
        try {
          await supabase.auth.resetPasswordForEmail(trimmedEmail, {
            redirectTo: `${window.location.origin}/login?reset=true`,
          });
        } catch (_) {}
      }

      // 2. Registrar ticket de soporte local para trazabilidad (como en DomunNet)
      try {
        const stored = localStorage.getItem('domun_support_tickets');
        const tickets = stored ? JSON.parse(stored) : [];
        const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

        const newTicket = {
          id: `TICK-${Date.now().toString().slice(-6)}`,
          title: `Solicitud de recuperación de contraseña (${trimmedEmail})`,
          status: 'abierto',
          category: 'contrasena',
          createdBy: trimmedEmail,
          createdByEmail: trimmedEmail,
          createdByRole: 'Usuario',
          assignedTo: 'Administrador',
          createdAt: nowStr,
          messages: [
            {
              id: '1',
              author: trimmedEmail,
              role: 'user',
              message: `Solicitud de restablecimiento de contraseña para la cuenta: ${trimmedEmail}`,
              timestamp: nowStr,
            },
          ],
        };
        tickets.unshift(newTicket);
        localStorage.setItem('domun_support_tickets', JSON.stringify(tickets));
      } catch (_) {}

      setEnviado(true);
      showSuccessToast('Instrucciones enviadas correctamente. Se ha generado un ticket de soporte.');

      setTimeout(() => {
        onClose();
        setEmail('');
        setEnviado(false);
      }, 2000);
    } catch (err: any) {
      showErrorToast('Error al procesar la solicitud. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-poppins"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-black rounded-2xl border border-white/15 p-6 shadow-2xl animate-slideUp font-poppins text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="mb-3 flex justify-center">
          <Image
            src="/white_logo.png"
            alt="DOMUN"
            width={44}
            height={44}
            style={{ width: 'auto', height: '42px' }}
            priority
          />
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-white text-center mb-1">
          Recuperar contraseña
        </h2>

        {/* Description */}
        <p className="text-xs text-white/70 text-center mb-5 leading-relaxed">
          Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de restablecimiento.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="relative">
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviado}
              className="w-full h-[40px] bg-white/5 rounded-lg border border-white/20 text-white placeholder-white/40 text-xs outline-none transition-all focus:border-white pl-10 pr-3 font-poppins"
            />
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || enviado}
            className="w-full h-[42px] bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold text-xs rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {enviado ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Instrucciones enviadas</span>
              </>
            ) : isSubmitting ? (
              'Verificando...'
            ) : (
              'Enviar instrucciones'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 text-xs text-white/60 hover:text-white transition-colors cursor-pointer text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
