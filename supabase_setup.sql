-- =========================================================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE: BITÁCORA DIGITAL (VAI - ANCOPIE)
-- =========================================================================
-- Copia y pega todo este script en el "SQL Editor" de tu proyecto de Supabase.

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Storage Bucket para Documentos PDF de Bitácora
INSERT INTO storage.buckets (id, name, public)
VALUES ('Bitacora-documentos', 'Bitacora-documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acceso publico de lectura a bitacora" ON storage.objects;
    DROP POLICY IF EXISTS "Permitir subida de documentos bitacora" ON storage.objects;
END $$;

CREATE POLICY "Acceso publico de lectura a bitacora"
ON storage.objects FOR SELECT
USING (bucket_id = 'Bitacora-documentos');

CREATE POLICY "Permitir subida de documentos bitacora"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Bitacora-documentos');


-- =========================================================================
-- 3. TABLA: rol
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(100) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    nivel_permisos INTEGER DEFAULT 10 CHECK (nivel_permisos BETWEEN 0 AND 100),
    permisos JSONB DEFAULT '{}'::JSONB,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. TABLA: usuario (Vinculada al UUID de Supabase Auth)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol_id UUID NOT NULL REFERENCES public.rol(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. TABLA: dato_usuario / perfil_usuario
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.perfil_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE UNIQUE,
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    nombre_completo VARCHAR(255) GENERATED ALWAYS AS (
        TRIM(primer_nombre || ' ' || COALESCE(segundo_nombre, '') || ' ' || primer_apellido || ' ' || COALESCE(segundo_apellido, ''))
    ) STORED,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    cargo_puesto VARCHAR(150) DEFAULT 'Supervisor de Campo',
    empresa_institucion VARCHAR(150) DEFAULT 'VAI - ANCOPIE',
    avatar_url VARCHAR(500),
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vista de compatibilidad para dato_usuario
CREATE OR REPLACE VIEW public.dato_usuario AS
SELECT * FROM public.perfil_usuario;

-- =========================================================================
-- 6. TABLA: proyecto_bitacora (Recomendación: Multi-obra / Tramos)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.proyecto_bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_proyecto VARCHAR(50) UNIQUE NOT NULL,
    nombre_oficial VARCHAR(255) NOT NULL,
    ubicacion_tramo VARCHAR(255),
    empresa_supervisora VARCHAR(200) DEFAULT 'ANCOPIE',
    empresa_contratista VARCHAR(200) DEFAULT 'VAI',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. TABLA: reportes_bitacora (Reportes diarios y documentos PDF)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reportes_bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES public.proyecto_bitacora(id) ON DELETE SET NULL,
    
    -- Control Temporal
    fecha DATE NOT NULL,
    dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 31),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL CHECK (anio >= 2020),
    hora TIME DEFAULT CURRENT_TIME,

    -- Datos de la Bitácora
    folio_numero INTEGER,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    observaciones_tecnicas TEXT,
    
    -- Documento PDF en Supabase Storage
    nombre_archivo VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    peso_bytes BIGINT NOT NULL,
    peso_formateado VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',

    -- Metadatos y Auditoría
    subido_por_usuario_id UUID REFERENCES public.usuario(id) ON DELETE SET NULL,
    nombre_responsable VARCHAR(200) NOT NULL,
    cargo_responsable VARCHAR(150) DEFAULT 'Ingeniero Residente',
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'aprobado' CHECK (estado IN ('borrador', 'pendiente_revision', 'aprobado', 'rechazado')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rep_fecha ON public.reportes_bitacora(fecha);
CREATE INDEX IF NOT EXISTS idx_rep_anio_mes ON public.reportes_bitacora(anio, mes);
CREATE INDEX IF NOT EXISTS idx_rep_dia ON public.reportes_bitacora(dia);

-- =========================================================================
-- 8. TABLA RECOMENDADA: auditoria_reporte (Trazabilidad legal de visualizaciones)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.auditoria_reporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES public.reportes_bitacora(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuario(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- 'VISUALIZAR_PDF', 'DESCARGAR_PDF', 'SUBIR_REPORTE'
    ip_origen VARCHAR(50),
    user_agent TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 9. TABLA RECOMENDADA: condiciones_climaticas_dia
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.condiciones_climaticas_dia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES public.reportes_bitacora(id) ON DELETE CASCADE UNIQUE,
    clima_manana VARCHAR(50) DEFAULT 'Soleado',
    clima_tarde VARCHAR(50) DEFAULT 'Soleado',
    horas_lluvia NUMERIC(4, 2) DEFAULT 0.00,
    trabajo_suspendido BOOLEAN DEFAULT FALSE,
    motivo_suspension VARCHAR(255)
);

-- =========================================================================
-- 10. POLÍTICAS RLS (Row Level Security)
-- =========================================================================
ALTER TABLE public.rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_bitacora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyecto_bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de roles" ON public.rol FOR SELECT USING (true);
CREATE POLICY "Lectura de usuarios" ON public.usuario FOR SELECT USING (true);
CREATE POLICY "Lectura de perfiles" ON public.perfil_usuario FOR SELECT USING (true);
CREATE POLICY "Lectura de proyectos" ON public.proyecto_bitacora FOR SELECT USING (true);
CREATE POLICY "Lectura publica de reportes" ON public.reportes_bitacora FOR SELECT USING (true);
CREATE POLICY "Insercion de reportes" ON public.reportes_bitacora FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de reportes" ON public.reportes_bitacora FOR UPDATE USING (true);

-- =========================================================================
-- 11. DATOS INICIALES SEMBRADOS (SEEDS)
-- =========================================================================
INSERT INTO public.rol (nombre_rol, descripcion, nivel_permisos, permisos)
VALUES 
    ('Administrador', 'Control total, subida de documentos y gestión', 100, '{"reportes": ["all"], "usuarios": ["all"]}'::JSONB),
    ('Usuario', 'Consulta de reportes mensuales, diarios y visor de PDF', 20, '{"reportes": ["read"]}'::JSONB)
ON CONFLICT (nombre_rol) DO NOTHING;

INSERT INTO public.proyecto_bitacora (codigo_proyecto, nombre_oficial, ubicacion_tramo, empresa_supervisora, empresa_contratista)
VALUES (
    'VAI-ANCOPIE-01',
    'Bitácora Digital VAI - ANCOPIE',
    'Tramo Principal de Obra Vial',
    'ANCOPIE Consultores',
    'Constructora VAI'
)
ON CONFLICT (codigo_proyecto) DO NOTHING;
