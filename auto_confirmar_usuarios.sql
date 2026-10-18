-- =========================================================================
-- ACTIVAR AUTO-CONFIRMACIÓN AUTOMÁTICA DE TODOS LOS USUARIOS
-- =========================================================================
-- Ejecuta este script en el "SQL Editor" de Supabase.

-- =========================================================================
-- PASO 1: Auto-verificar usuarios existentes (solo usando email_confirmed_at)
-- =========================================================================
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- =========================================================================
-- PASO 2: Trigger para que CUALQUIER usuario nuevo nazca verificado
-- =========================================================================
CREATE OR REPLACE FUNCTION public.fn_auto_confirmar_usuario()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_confirmar_usuario ON auth.users;
CREATE TRIGGER trg_auto_confirmar_usuario
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_confirmar_usuario();

-- =========================================================================
-- PASO 3: Trigger para crear automáticamente su Rol y Perfil en la BD
-- =========================================================================
CREATE OR REPLACE FUNCTION public.fn_crear_perfil_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_rol_id UUID;
    v_primer_nombre TEXT;
    v_primer_apellido TEXT;
    v_es_admin BOOLEAN;
BEGIN
    -- Detectar si es administrador (por email o metadata)
    v_es_admin := (NEW.email ILIKE '%admin%') OR (NEW.raw_user_meta_data->>'rol' = 'Administrador');

    IF v_es_admin THEN
        SELECT id INTO v_rol_id FROM public.rol WHERE nombre_rol = 'Administrador' LIMIT 1;
    ELSE
        SELECT id INTO v_rol_id FROM public.rol WHERE nombre_rol = 'Usuario' LIMIT 1;
    END IF;

    IF v_rol_id IS NULL THEN
        SELECT id INTO v_rol_id FROM public.rol LIMIT 1;
    END IF;

    v_primer_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
    v_primer_apellido := COALESCE(NEW.raw_user_meta_data->>'apellido', 'Usuario');

    -- 1. Insertar en tabla usuario
    INSERT INTO public.usuario (id, correo, rol_id, activo, ultimo_acceso)
    VALUES (NEW.id, NEW.email, v_rol_id, true, NOW())
    ON CONFLICT (id) DO UPDATE SET rol_id = EXCLUDED.rol_id;

    -- 2. Insertar en tabla perfil_usuario
    INSERT INTO public.perfil_usuario (
        usuario_id,
        primer_nombre,
        primer_apellido,
        correo,
        cargo_puesto,
        empresa_institucion
    )
    VALUES (
        NEW.id,
        v_primer_nombre,
        v_primer_apellido,
        NEW.email,
        CASE WHEN v_es_admin THEN 'Administrador de Proyecto' ELSE 'Supervisor de Obra' END,
        'VAI - ANCOPIE'
    )
    ON CONFLICT (usuario_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_crear_perfil_automatico ON auth.users;
CREATE TRIGGER trg_crear_perfil_automatico
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_crear_perfil_automatico();

-- =========================================================================
-- PASO 4: Políticas RLS abiertas para usuario y perfil_usuario
-- =========================================================================
DROP POLICY IF EXISTS "Insertar usuarios" ON public.usuario;
DROP POLICY IF EXISTS "Actualizar usuarios" ON public.usuario;
DROP POLICY IF EXISTS "Insertar perfiles" ON public.perfil_usuario;
DROP POLICY IF EXISTS "Actualizar perfiles" ON public.perfil_usuario;

CREATE POLICY "Insertar usuarios" ON public.usuario FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar usuarios" ON public.usuario FOR UPDATE USING (true);
CREATE POLICY "Insertar perfiles" ON public.perfil_usuario FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar perfiles" ON public.perfil_usuario FOR UPDATE USING (true);

-- =========================================================================
-- PASO 5: Vincular al Administrador actual
-- =========================================================================
INSERT INTO public.usuario (id, correo, rol_id)
SELECT u.id, u.email, r.id
FROM auth.users u
CROSS JOIN (SELECT id FROM public.rol WHERE nombre_rol = 'Administrador' LIMIT 1) r
WHERE u.email = 'admin@bitacoradigital.com'
ON CONFLICT (id) DO UPDATE SET rol_id = EXCLUDED.rol_id;

INSERT INTO public.perfil_usuario (usuario_id, primer_nombre, primer_apellido, correo, cargo_puesto, empresa_institucion)
SELECT u.id, 'Daniel', 'Figueroa', u.email, 'Administrador de Proyecto', 'VAI - ANCOPIE'
FROM auth.users u
WHERE u.email = 'admin@bitacoradigital.com'
ON CONFLICT (usuario_id) DO NOTHING;
