export const ROLE_OPTIONS = ['owner', 'biller', 'viewer'] as const;

export const roleLabel: Record<string, string> = {
    owner: 'Admin',
    biller: 'Faturista',
    viewer: 'Visualizador',
    super_admin: 'Super Admin',
};