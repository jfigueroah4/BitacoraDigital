export function formatearNombrePropio(valor?: string | null): string {
  if (!valor) return '';
  return valor.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/g, (palabra) => {
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  });
}

export function formatFullName(
  primerNombre: string,
  primerApellido: string,
  segundoNombre?: string | null,
  segundoApellido?: string | null
): string {
  const partes = [primerNombre, segundoNombre, primerApellido, segundoApellido];
  const full = partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' ') || 'Usuario';
  return formatearNombrePropio(full);
}

export function formatearFechaLegible(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  const limpia = String(fechaStr).split('T')[0].trim();
  const partes = limpia.split('-');
  if (partes.length === 3 && partes[0].length === 4) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const anio = partes[0];
    const mesIdx = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    if (mesIdx >= 0 && mesIdx < 12 && !isNaN(dia)) {
      return `${dia} ${meses[mesIdx]} ${anio}`;
    }
  }
  return limpia;
}
