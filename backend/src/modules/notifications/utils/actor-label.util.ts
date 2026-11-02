const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  technician: 'Técnico',
  employee: 'Técnico',
};

export function roleLabel(role?: string | null): string {
  return ROLE_LABELS[(role || '').toLowerCase()] || 'Usuario';
}

export function describeActor(
  role?: string | null,
  name?: string | null,
): string {
  return `${roleLabel(role)}: ${name || 'Usuario'}`;
}
