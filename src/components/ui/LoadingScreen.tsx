'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const pathname = usePathname();

  const isDarkTheme = pathname === '/login' || pathname?.startsWith('/login');

  const handleFinish = useCallback(() => {
    setShow(false);
  }, []);

  useEffect(() => {
    // Iniciar desvanecimiento ágil a los 350ms
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 350);

    // Desmontar completamente a los 650ms
    const unmountTimer = setTimeout(() => {
      setShow(false);
    }, 650);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      id="global-loading-screen"
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && fade) {
          handleFinish();
        }
      }}
      className={`loading-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-300 ease-out ${
        isDarkTheme ? 'bg-[#140B07]' : 'bg-[#F3F4F7]'
      } ${fade ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 pointer-events-auto'}`}
      style={{
        // Respaldo CSS nativo por si se interrumpe el ciclo de React
        animation: 'screenFadeOut 0.3s ease-out 0.4s forwards',
      }}
      onAnimationEnd={handleFinish}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes screenFadeOut {
              0% { opacity: 1; visibility: visible; }
              99% { opacity: 0; visibility: visible; }
              100% { opacity: 0; visibility: hidden; pointer-events: none; display: none; }
            }
          `,
        }}
      />
      <div className="loading-content flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 animate-pulse">
          <Image
            src={isDarkTheme ? '/white_logo.png' : '/logo.png'}
            alt="Bitácora Digital"
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span
            className={`text-[10px] font-bold tracking-[0.2em] uppercase font-poppins ${
              isDarkTheme ? 'text-white/70' : 'text-gray-500'
            }`}
          >
            Cargando
          </span>
          <div className="flex gap-1.5 items-center justify-center mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${
                isDarkTheme ? 'bg-[#D7CCC8]' : 'bg-[#3B2219]'
              }`}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${
                isDarkTheme ? 'bg-[#D7CCC8]' : 'bg-[#3B2219]'
              }`}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                isDarkTheme ? 'bg-[#D7CCC8]' : 'bg-[#3B2219]'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
