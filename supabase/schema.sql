-- ============================================================================
-- ESQUEMA DE BASE DE DATOS: BITÁCORA DIGITAL (VAI - ANCOPIE)
-- PLATAFORMA: SUPABASE (POSTGRESQL 15+)
-- ============================================================================

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CONTROL DE ACCESO, IDENTIDAD Y ROLES
-- ============================================================================

-- TABLA: rol
-- Define los roles del sistema (Administrador, Supervisor, Usuario Regular, etc.)
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

COMMENT ON TABLE public.rol IS 'Roles y niveles de jerarquía del sistema de bitácora.';
COMMENT ON COLUMN public.rol.nivel_permisos IS 'Nivel de 0 a 100 (100: Administrador con control total, 20: Usuario de consulta).';

-- TABLA: usuario
-- Vincula la cuenta de autenticación de Supabase (auth.users) con la lógica interna
CREATE TABLE IF NOT EXISTS public.usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol_id UUID NOT NULL REFERENCES public.rol(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.usuario IS 'Entidad de usuario vinculada al UUID nativo de auth.users de Supabase.';

-- TABLA: dato_usuario / perfil_usuario
-- Repositorio completo con nombres, datos personales, cargo y avatar
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

COMMENT ON TABLE public.perfil_usuario IS 'Perfil detallado y datos personales del usuario.';

-- ============================================================================
-- 2. TABLA DE REPORTES / BITÁCORA DIARIA (DOCUMENTOS PDF)
-- ============================================================================

-- TABLA: reportes_bitacora
-- Almacena los reportes y documentos PDF registrados día a día
CREATE TABLE IF NOT EXISTS public.reportes_bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Control Temporal (Día, Mes, Año)
    fecha DATE NOT NULL,
    dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 31),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL CHECK (anio >= 2020),
    hora TIME DEFAULT CURRENT_TIME,

    -- Datos del Reporte de Obra
    folio_numero INTEGER,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    observaciones_tecnicas TEXT,
    
    -- Archivo PDF Almacenado en Supabase Storage
    nombre_archivo VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Ej: '2026/10/15/folio_045_15Oct2026.pdf'
    peso_bytes BIGINT NOT NULL,
    peso_formateado VARCHAR(50) NOT NULL, -- Ej: '100 KB'
    mime_type VARCHAR(100) DEFAULT 'application/pdf',

    -- Metadatos y Auditoría
    subido_por_usuario_id UUID REFERENCES public.usuario(id) ON DELETE SET NULL,
    nombre_responsable VARCHAR(200) NOT NULL,
    cargo_responsable VARCHAR(150) DEFAULT 'Ingeniero Residente',
    
    -- Estado del reporte
    estado VARCHAR(50) DEFAULT 'aprobado' CHECK (estado IN ('borrador', 'pendiente_revision', 'aprobado', 'rechazado')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Restricción opcional para asegurar unicidad por fecha y folio
    CONSTRAINT uq_fecha_folio UNIQUE (fecha, folio_numero)
);

COMMENT ON TABLE public.reportes_bitacora IS 'Tabla principal de reportes diarios de bitácora y documentos PDF asociados.';

-- Índices de alto rendimiento para búsqueda rápida y filtrado por calendario
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON public.reportes_bitacora(fecha);
CREATE INDEX IF NOT EXISTS idx_reportes_anio_mes ON public.reportes_bitacora(anio, mes);
CREATE INDEX IF NOT EXISTS idx_reportes_dia ON public.reportes_bitacora(dia);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON public.reportes_bitacora(estado);

-- ============================================================================
-- 3. TABLAS RECOMENDADAS ADICIONALES
-- ============================================================================

-- RECOMENDACIÓN 1: TABLA proyecto_bitacora
-- Permite que la bitácora no esté amarrada a un solo proyecto en código duro,
-- facilitando múltiples tramos o contratos de obra (ej. VAI - ANCOPIE Fase 1, Tramo 2, etc.)
CREATE TABLE IF NOT EXISTS public.proyecto_bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_proyecto VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'VAI-ANCOPIE'
    nombre_oficial VARCHAR(255) NOT NULL,
    ubicacion_tramo VARCHAR(255),
    empresa_supervisora VARCHAR(200) DEFAULT 'ANCOPIE',
    empresa_contratista VARCHAR(200) DEFAULT 'VAI',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar relación en reportes_bitacora hacia proyecto si se desea
ALTER TABLE public.reportes_bitacora 
ADD COLUMN IF NOT EXISTS proyecto_id UUID REFERENCES public.proyecto_bitacora(id) ON DELETE SET NULL;

-- RECOMENDACIÓN 2: TABLA auditoria_reporte
-- Esencial para bitácoras con validez legal. Registra quién consultó, vio el PDF o subió cambios.
CREATE TABLE IF NOT EXISTS public.auditoria_reporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES public.reportes_bitacora(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuario(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- 'VISUALIZAR_PDF', 'DESCARGAR_PDF', 'SUBIR_REPORTE', 'EDITAR', 'ELIMINAR'
    ip_origen VARCHAR(50),
    user_agent TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.auditoria_reporte IS 'Bitácora de auditoría y trazabilidad de lecturas y subidas de documentos PDF.';

-- RECOMENDACIÓN 3: TABLA condiciones_climaticas_dia
-- Vital para justificar atrasos, suspensiones de actividades y ampliaciones de plazo en carreteras
CREATE TABLE IF NOT EXISTS public.condiciones_climaticas_dia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES public.reportes_bitacora(id) ON DELETE CASCADE UNIQUE,
    clima_manana VARCHAR(50) DEFAULT 'Soleado', -- 'Soleado', 'Nublado', 'Lluvia leve', 'Lluvia intensa'
    clima_tarde VARCHAR(50) DEFAULT 'Soleado',
    horas_lluvia NUMERIC(4, 2) DEFAULT 0.00,
    trabajo_suspendido BOOLEAN DEFAULT FALSE,
    motivo_suspension VARCHAR(255),
    temperatura_promedio NUMERIC(4, 1)
);

COMMENT ON TABLE public.condiciones_climaticas_dia IS 'Registro de condiciones climáticas y horas de lluvia que afectaron la jornada.';

-- RECOMENDACIÓN 4: TABLA firmas_reporte
-- Permite registrar la firma y visto bueno tanto del Supervisor como del Contratista
CREATE TABLE IF NOT EXISTS public.firmas_reporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID NOT NULL REFERENCES public.reportes_bitacora(id) ON DELETE CASCADE,
    firmado_por_usuario_id UUID REFERENCES public.usuario(id) ON DELETE RESTRICT,
    tipo_firmante VARCHAR(50) NOT NULL, -- 'SUPERVISOR', 'CONTRATISTA', 'DELEGADO_RESIDENTE'
    nombre_firmante VARCHAR(200) NOT NULL,
    firma_digital_hash VARCHAR(255), -- Huella digital criptográfica o URL de rúbrica
    fecha_firma TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TRIGGERS AUTOMÁTICOS PARA updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rol
BEFORE UPDATE ON public.rol
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

CREATE TRIGGER trg_update_usuario
BEFORE UPDATE ON public.usuario
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

CREATE TRIGGER trg_update_perfil_usuario
BEFORE UPDATE ON public.perfil_usuario
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

CREATE TRIGGER trg_update_reportes_bitacora
BEFORE UPDATE ON public.reportes_bitacora
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_timestamp();

-- ============================================================================
-- 5. TRIGGER AUTOMÁTICO: Crear perfil al registrar usuario en Supabase Auth
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol_usuario_id UUID;
BEGIN
    -- Obtener el ID del rol por defecto (Usuario regular)
    SELECT id INTO v_rol_usuario_id FROM public.rol WHERE nombre_rol = 'Usuario' LIMIT 1;

    -- Si no existe el rol, crearlo
    IF v_rol_usuario_id IS NULL THEN
        INSERT INTO public.rol (nombre_rol, descripcion, nivel_permisos)
        VALUES ('Usuario', 'Usuario regular de consulta', 20)
        RETURNING id INTO v_rol_usuario_id;
    END IF;

    -- 1. Insertar en tabla usuario
    INSERT INTO public.usuario (id, correo, rol_id)
    VALUES (NEW.id, NEW.email, v_rol_usuario_id)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insertar perfil básico en perfil_usuario
    INSERT INTO public.perfil_usuario (
        usuario_id,
        primer_nombre,
        primer_apellido,
        correo,
        cargo_puesto
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'apellido', 'Sistema'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'cargo', 'Consulta de Bitácora')
    )
    ON CONFLICT (usuario_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 6. DATOS INICIALES (SEEDS)
-- ============================================================================

-- Roles iniciales
INSERT INTO public.rol (nombre_rol, descripcion, nivel_permisos, permisos)
VALUES 
    ('Administrador', 'Control total, subida de documentos y gestión', 100, '{"reportes": ["create", "read", "update", "delete"], "usuarios": ["all"]}'::JSONB),
    ('Usuario', 'Consulta de reportes mensuales, diarios y visor de PDF', 20, '{"reportes": ["read"]}'::JSONB)
ON CONFLICT (nombre_rol) DO UPDATE SET nivel_permisos = EXCLUDED.nivel_permisos;

-- Proyecto inicial VAI - ANCOPIE
INSERT INTO public.proyecto_bitacora (codigo_proyecto, nombre_oficial, ubicacion_tramo, empresa_supervisora, empresa_contratista)
VALUES (
    'VAI-ANCOPIE-01',
    'Bitácora Digital VAI - ANCOPIE',
    'Tramo Principal de Obra Vial',
    'ANCOPIE Consultores',
    'Constructora VAI'
)
ON CONFLICT (codigo_proyecto) DO NOTHING;


-- =========================================================================
-- 12. PERMISOS EXPLÍCITOS PARA DATA API DE SUPABASE (NORMATIVA 30 DE OCTUBRE)
-- =========================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
