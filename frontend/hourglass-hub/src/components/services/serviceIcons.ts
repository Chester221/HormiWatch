import {
  Wrench, Code, Database, Bug, Headphones, Briefcase, Users, PenTool,
  Server, Shield, Search, BarChart3, Palette, Landmark, ClipboardCheck,
  Tag, Globe, Rocket, MessageSquare, Layers, Cpu, Smartphone, Cloud, Star,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceVisual {
  icon: LucideIcon;
  color: string;
}

// ============================================
// ICONOS PARA EL SERVICIO (selector visual en el formulario)
// ============================================
export const ICON_OPTIONS: { name: string; icon: LucideIcon; color: string }[] = [
  // Tecnología y desarrollo
  { name: "Wrench", icon: Wrench, color: "#0DA2E7" },
  { name: "Code", icon: Code, color: "#3B82F6" },
  { name: "Database", icon: Database, color: "#6366F1" },
  { name: "Server", icon: Server, color: "#06B6D4" },
  { name: "Cpu", icon: Cpu, color: "#EF4444" },
  { name: "Smartphone", icon: Smartphone, color: "#3B82F6" },
  { name: "Cloud", icon: Cloud, color: "#0EA5E9" },
  { name: "Layers", icon: Layers, color: "#6366F1" },
  // Diseño y creación
  { name: "PenTool", icon: PenTool, color: "#EC4899" },
  { name: "Palette", icon: Palette, color: "#EC4899" },
  { name: "Boxes", icon: Boxes, color: "#F97316" },
  // Consultoría, análisis y soporte
  { name: "Briefcase", icon: Briefcase, color: "#F97316" },
  { name: "Users", icon: Users, color: "#8B5CF6" },
  { name: "MessageSquare", icon: MessageSquare, color: "#06B6D4" },
  { name: "Headphones", icon: Headphones, color: "#F59E0B" },
  { name: "Search", icon: Search, color: "#14B8A6" },
  { name: "BarChart3", icon: BarChart3, color: "#F59E0B" },
  { name: "ClipboardCheck", icon: ClipboardCheck, color: "#14B8A6" },
  // Seguridad, infraestructura y gestión
  { name: "Shield", icon: Shield, color: "#8B5CF6" },
  { name: "Bug", icon: Bug, color: "#22C55E" },
  { name: "Landmark", icon: Landmark, color: "#10B981" },
  { name: "Globe", icon: Globe, color: "#10B981" },
  { name: "Rocket", icon: Rocket, color: "#EF4444" },
  { name: "Star", icon: Star, color: "#FACC15" },
];

// ============================================
// VISUAL POR CATEGORÍA
// ============================================
const CATEGORY_VISUALS: Record<string, ServiceVisual> = {
  "Desarrollo": { icon: Code, color: "#3B82F6" },
  "Desarrollo Frontend": { icon: Code, color: "#3B82F6" },
  "Desarrollo Backend": { icon: Database, color: "#6366F1" },
  "Testing QA": { icon: Bug, color: "#22C55E" },
  "Soporte Técnico": { icon: Headphones, color: "#0DA2E7" },
  "Consultoría": { icon: Briefcase, color: "#F97316" },
  "Reunión": { icon: Users, color: "#8B5CF6" },
  "Diseño": { icon: PenTool, color: "#EC4899" },
  "Evaluación": { icon: Search, color: "#8B5CF6" },
  "Mantenimiento": { icon: Wrench, color: "#F59E0B" },
  "Integración Bancaria": { icon: Landmark, color: "#10B981" },
  "Análisis de Datos": { icon: BarChart3, color: "#06B6D4" },
  "Infraestructura": { icon: Server, color: "#6366F1" },
  "Consulta": { icon: ClipboardCheck, color: "#14B8A6" },
  "Seguridad": { icon: Shield, color: "#EF4444" },
  "Sin categoría": { icon: Tag, color: "#6B7280" },
};

const CATEGORY_ICON_KEYS: Record<string, string> = {
  "Desarrollo": "Code",
  "Desarrollo Frontend": "Code",
  "Desarrollo Backend": "Database",
  "Testing QA": "Bug",
  "Soporte Técnico": "Headphones",
  "Consultoría": "Briefcase",
  "Reunión": "Users",
  "Diseño": "PenTool",
  "Evaluación": "Search",
  "Mantenimiento": "Wrench",
  "Integración Bancaria": "Landmark",
  "Análisis de Datos": "BarChart3",
  "Infraestructura": "Server",
  "Consulta": "ClipboardCheck",
  "Seguridad": "Shield",
};

export const getCategoryIconKey = (name?: string | null): string =>
  CATEGORY_ICON_KEYS[name || ""] || "Wrench";

export const getCategoryVisual = (name?: string | null): ServiceVisual =>
  CATEGORY_VISUALS[name || ""] || CATEGORY_VISUALS["Sin categoría"];

export const getServiceIconVisual = (iconName?: string | null): ServiceVisual | null => {
  const option = ICON_OPTIONS.find((o) => o.name === iconName);
  return option ? { icon: option.icon, color: option.color } : null;
};

export const formatRate = (rate?: number | null) =>
  `$${Number(rate || 0).toLocaleString("es-MX")}/h`;

// ============================================
// COLOR POR SERVICIO (determinístico si no hay color asignado)
// ============================================
export const SERVICE_COLOR_PALETTE = [
  "#0DA2E7",
  "#3B82F6",
  "#6366F1",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#22C55E",
  "#FACC15",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
];

export const pickServiceColor = (name?: string | null): string => {
  const source = name || "Servicio";
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return SERVICE_COLOR_PALETTE[hash % SERVICE_COLOR_PALETTE.length];
};