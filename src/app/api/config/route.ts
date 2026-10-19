import { NextRequest, NextResponse } from 'next/server';
import { DURACION_PROYECTO_DEFAULT, DuracionProyecto } from '@/lib/mockData';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'duracion-config.json');

function leerDuracionGuardada(): DuracionProyecto {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (
        parsed &&
        typeof parsed.mesInicio === 'number' &&
        typeof parsed.anioInicio === 'number' &&
        typeof parsed.mesFin === 'number' &&
        typeof parsed.anioFin === 'number'
      ) {
        return parsed;
      }
    }
  } catch (_) {}
  return DURACION_PROYECTO_DEFAULT;
}

function guardarDuracionEnDisco(duracion: DuracionProyecto) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(duracion, null, 2), 'utf-8');
  } catch (_) {}
}

let duracionServidor: DuracionProyecto = leerDuracionGuardada();

export async function GET(req: NextRequest) {
  // 1. Check in-memory / disk
  let actual = duracionServidor;
  if (actual === DURACION_PROYECTO_DEFAULT) {
    actual = leerDuracionGuardada();
    duracionServidor = actual;
  }

  // 2. Fallback to cookie if present
  const cookieVal = req.cookies.get('bitacora_duracion_proyecto')?.value;
  if (cookieVal) {
    try {
      const parsedCookie = JSON.parse(decodeURIComponent(cookieVal));
      if (parsedCookie?.mesInicio && parsedCookie?.anioInicio) {
        actual = parsedCookie;
        duracionServidor = actual;
      }
    } catch (_) {}
  }

  return NextResponse.json({
    success: true,
    duracion: actual,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (
      body &&
      typeof body.mesInicio === 'number' &&
      typeof body.anioInicio === 'number' &&
      typeof body.mesFin === 'number' &&
      typeof body.anioFin === 'number'
    ) {
      duracionServidor = {
        mesInicio: body.mesInicio,
        anioInicio: body.anioInicio,
        mesFin: body.mesFin,
        anioFin: body.anioFin,
      };

      guardarDuracionEnDisco(duracionServidor);

      const res = NextResponse.json({ success: true, duracion: duracionServidor });
      res.cookies.set('bitacora_duracion_proyecto', encodeURIComponent(JSON.stringify(duracionServidor)), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
        sameSite: 'lax',
      });
      return res;
    }
    return NextResponse.json({ success: false, error: 'Datos de duración inválidos' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
