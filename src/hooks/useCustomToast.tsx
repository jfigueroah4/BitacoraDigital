import { toast } from 'sonner';
import { X, Check } from 'lucide-react';
import React from 'react';

const calcularDuracionToast = (mensaje: string): number => {
  const len = (mensaje || '').length;
  if (len > 140) return 10000;
  if (len > 70) return 7500;
  return 5000;
};

export const showErrorToast = (message: string) => {
  toast.dismiss();
  const isLong = (message || '').length > 65;
  const duration = calcularDuracionToast(message);

  toast.custom(
    (t) => (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #EBEBEB',
          borderRadius: '10px',
          padding: isLong ? '10px 14px' : '8px 12px',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12px',
          lineHeight: '1.45',
          color: '#1F1F1F',
          width: isLong ? 'min(580px, calc(100vw - 32px))' : 'max-content',
          maxWidth: 'min(580px, calc(100vw - 32px))',
          display: 'flex',
          alignItems: isLong ? 'flex-start' : 'center',
          gap: '9px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#FF4D4F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: isLong ? '1px' : '0',
          }}
        >
          <X size={11} color="#FFFFFF" strokeWidth={3} />
        </div>
        <span
          style={{
            flex: 1,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            letterSpacing: '-0.01em',
          }}
        >
          {message}
        </span>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          aria-label="Cerrar notificación"
          style={{
            marginLeft: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            flexShrink: 0,
            marginTop: isLong ? '1px' : '0',
            color: '#8C8C8C',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1F1F1F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8C8C8C';
          }}
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration }
  );
};

export const showSuccessToast = (message: string) => {
  toast.dismiss();
  const isLong = (message || '').length > 65;
  const duration = calcularDuracionToast(message);

  toast.custom(
    (t) => (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #EBEBEB',
          borderRadius: '10px',
          padding: isLong ? '10px 14px' : '8px 12px',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12px',
          lineHeight: '1.45',
          color: '#1F1F1F',
          width: isLong ? 'min(580px, calc(100vw - 32px))' : 'max-content',
          maxWidth: 'min(580px, calc(100vw - 32px))',
          display: 'flex',
          alignItems: isLong ? 'flex-start' : 'center',
          gap: '9px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#52C41A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: isLong ? '1px' : '0',
          }}
        >
          <Check size={11} color="#FFFFFF" strokeWidth={3} />
        </div>
        <span
          style={{
            flex: 1,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            letterSpacing: '-0.01em',
          }}
        >
          {message}
        </span>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          aria-label="Cerrar notificación"
          style={{
            marginLeft: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            flexShrink: 0,
            marginTop: isLong ? '1px' : '0',
            color: '#8C8C8C',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1F1F1F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8C8C8C';
          }}
        >
          <X size={14} />
        </button>
      </div>
    ),
    { duration }
  );
};

export function useCustomToast() {
  return { showErrorToast, showSuccessToast };
}
