'use client';

import React from 'react';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
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
