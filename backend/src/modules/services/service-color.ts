/**
 * Paleta armónica para el color del icono de cada servicio.
 * Se usa al crear un servicio cuando el cliente no envía color.
 */

export const SERVICE_COLORS = [
  '#0DA2E7',
  '#3B82F6',
  '#6366F1',
  '#06B6D4',
  '#14B8A6',
  '#10B981',
  '#22C55E',
  '#FACC15',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
];

export function pickServiceColor(name: string, seed?: string | null): string {
  const source = seed || name || 'Servicio';
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return SERVICE_COLORS[hash % SERVICE_COLORS.length];
}
