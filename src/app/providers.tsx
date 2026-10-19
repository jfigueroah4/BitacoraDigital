'use client';

import React from 'react';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    try {
      const currentBuild = process.env.NEXT_PUBLIC_BUILD_TIME;
      if (currentBuild) {
        const storedBuild = localStorage.getItem('bitacora_build_id');
        if (storedBuild && storedBuild !== currentBuild) {
          // Se detectó un nuevo despliegue o reinicio del servidor
          localStorage.removeItem('bitacora_user_profile');
          localStorage.removeItem('bitacora_session_expiry');
          localStorage.setItem('bitacora_build_id', currentBuild);
          document.cookie = 'bitacora_token=; path=/; max-age=0';
          document.cookie = 'token=; path=/; max-age=0';
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }
        localStorage.setItem('bitacora_build_id', currentBuild);
      }
    } catch (_) {}
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        [data-sonner-toaster] {
          position: fixed !important;
          top: 24px !important;
          left: 50% !important;
          right: auto !important;
          bottom: auto !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: max-content !important;
          max-width: 94vw !important;
          margin: 0 auto !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        }

        [data-sonner-toaster] ol {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          margin: 0 auto !important;
          padding: 0 !important;
          list-style: none !important;
        }

        [data-sonner-toaster] li {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto !important;
          width: max-content !important;
        }

        [data-sonner-toast] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          width: max-content !important;
          max-width: 94vw !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto !important;
          pointer-events: auto !important;
          transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @media (max-width: 768px) {
          [data-sonner-toaster] {
            left: 0 !important;
            right: 0 !important;
            top: 12px !important;
            transform: none !important;
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 0 12px !important;
          }
        }
      `,
        }}
      />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            padding: 0,
          },
        }}
      />
      {children}
    </>
  );
}
