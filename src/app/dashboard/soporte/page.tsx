'use client';

import React from 'react';
import { ArrowLeft, Mail, GraduationCap, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TopBar from '@/components/layout/TopBar';

export default function SoportePage() {
  const router = useRouter();

  const supportInfo = {
    name: 'Josue Daniel Figueroa Herrera',
    phone: '+502 56252922',
    personalEmail: 'josuedanielf2002@gmail.com',
    universityEmail: 'jfigueroah4@miumg.edu.gt',
    university: 'Universidad Mariano Gálvez de Guatemala, Sede Villa Nueva',
    carneId: '5090-22-36',
  };

  return (
    <div className="min-h-screen bg-[#F3F4F7] text-[#07152B] flex flex-col font-poppins selection:bg-[#3B2219] selection:text-white">
      <TopBar seccion="Soporte Técnico" bitacoraNombre="Proyecto: Conexion VAS – Hincapie" />

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Header con botón Volver */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2.5 hover:bg-white rounded-xl transition-all text-gray-700 bg-white/70 border border-gray-200 shadow-2xs cursor-pointer"
            title="Volver a Bitácoras"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Soporte Técnico &bull; Bitácora Electrónica
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Información institucional y contacto del desarrollador del sistema
            </p>
          </div>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Columna Izquierda: Información de contacto e institucional */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5 justify-between">
            {/* Cuadro 1 - Información de Contacto */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                  <div className="p-2 rounded-lg bg-[#F4ECE6] text-[#3B2219]">
                    <Mail size={18} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información de Contacto</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Teléfono / WhatsApp
                    </label>
                    <a
                      href={`tel:${supportInfo.phone}`}
                      className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#3B2219] transition-colors"
                    >
                      {supportInfo.phone}
                    </a>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Correo Personal
                    </label>
                    <a
                      href={`mailto:${supportInfo.personalEmail}`}
                      className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#3B2219] transition-colors"
                    >
                      {supportInfo.personalEmail}
                    </a>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Correo Universitario
                    </label>
                    <a
                      href={`mailto:${supportInfo.universityEmail}`}
                      className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 block hover:text-[#3B2219] transition-colors"
                    >
                      {supportInfo.universityEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuadro 2 - Información Institucional */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                  <div className="p-2 rounded-lg bg-[#F4ECE6] text-[#3B2219]">
                    <GraduationCap size={18} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información Institucional</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Universidad y Sede
                    </label>
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {supportInfo.university}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Carné Estudiantil
                    </label>
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {supportInfo.carneId}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Responsable / Autor
                    </label>
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {supportInfo.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta con el Logo UMG */}
          <div className="lg:col-span-5 xl:col-span-4 flex">
            <div className="w-full bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                <Image
                  src="/logoumg.png"
                  alt="Logo UMG"
                  fill
                  sizes="(max-width: 768px) 220px, 260px"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">{supportInfo.name}</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Universidad Mariano Gálvez de Guatemala
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

