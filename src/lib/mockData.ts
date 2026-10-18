import { DocumentoBitacora, MesInfo } from '@/types/bitacora';

export const MESES_NOMBRES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getDiasEnMes(mes: number, anio: number): number {
  return new Date(anio, mes, 0).getDate();
}

// PDF minimal de demostración codificado en Base64 para visualización instantánea sin dependencias externas
export const SAMPLE_PDF_BASE64 = `data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDUgMCBSCj4+Cj4+Cj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggMTg5Cj4+CnN0cmVhbQpCVAovRjEgMjAgVGYKMzAgODAwIFRkCihCSVRBQ09SQSBESUdJVEFMIC0gVkFJLUFOQ09QSUUpIFRqCjAgLTMwIFRkCi9GMSAxMiBUZgooRm9saW8gZGUgQml0YWNvcmEgZGUgT2JyYSAtIFN1cGVydmlzaW9uIFRlY25pY2EpIFRqCjAgLTIwIFRkCihGZWNoYTogMTUgZGUgT2N0dWJyZSAyMDI2IHwgRXN0YWRvOiBBcHJvYmFkbykgVGoKMCAtdmVyIDAgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDExOSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDA0ODMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo1NzMKJSVFT0YK`;

export const DOCUMENTOS_INICIALES: DocumentoBitacora[] = [];

export interface DuracionProyecto {
  mesInicio: number; // 1..12
  anioInicio: number;
  mesFin: number; // 1..12
  anioFin: number;
}

export const DURACION_PROYECTO_DEFAULT: DuracionProyecto = {
  mesInicio: 1,
  anioInicio: 2026,
  mesFin: 12,
  anioFin: 2026,
};

export function generarMesesPorDuracion(
  duracion: DuracionProyecto,
  documentos: DocumentoBitacora[] = DOCUMENTOS_INICIALES,
  anioFiltro?: number | null
): MesInfo[] {
  const resultado: MesInfo[] = [];

  let curAnio = duracion.anioInicio;
  let curMes = duracion.mesInicio;

  // Safeguard to prevent infinite loops if dates are inverted
  const maxIter = 120; // up to 10 years
  let iter = 0;

  while (
    (curAnio < duracion.anioFin || (curAnio === duracion.anioFin && curMes <= duracion.mesFin)) &&
    iter < maxIter
  ) {
    iter++;

    if (!anioFiltro || anioFiltro === curAnio) {
      const nombreMes = MESES_NOMBRES[curMes - 1];
      const docsDelMes = documentos.filter((d) => d.mes === curMes && d.anio === curAnio);
      const diasUnicos = new Set(docsDelMes.map((d) => d.dia)).size;

      resultado.push({
        mes: curMes,
        anio: curAnio,
        nombre: `${nombreMes} ${curAnio}`,
        nombreMes,
        totalDias: getDiasEnMes(curMes, curAnio),
        diasConDocumentos: diasUnicos,
        documentos: docsDelMes,
      });
    }

    curMes++;
    if (curMes > 12) {
      curMes = 1;
      curAnio++;
    }
  }

  // If filtered by year or if result is empty, at least return an array
  return resultado;
}

export function generarMeses(anio = 2026, documentos: DocumentoBitacora[] = DOCUMENTOS_INICIALES): MesInfo[] {
  return MESES_NOMBRES.map((nombreMes, index) => {
    const mesNum = index + 1;
    const docsDelMes = documentos.filter((d) => d.mes === mesNum && d.anio === anio);
    const diasUnicos = new Set(docsDelMes.map((d) => d.dia)).size;

    return {
      mes: mesNum,
      anio,
      nombre: `${nombreMes} ${anio}`,
      nombreMes,
      totalDias: getDiasEnMes(mesNum, anio),
      diasConDocumentos: diasUnicos,
      documentos: docsDelMes,
    };
  });
}
