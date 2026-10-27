import path from "node:path";
import { FRONTEND_DIR } from "./env";

// Contas fictícias do E2eSeeder (glosas-api/database/seeders). Nunca credencial real.
export const USERS = {
    owner: { email: 'ana@clinica-exemplo.com', password: 'password', home: /\/dashboard$/ },
    otherClinic: { email: 'bruno@clinica-isolamento.test', password: 'password', home: /\/dashboard$/ },
    superAdmin: { email: 'admin@glosasai.com.br', password: 'password', home: /\/admin\/errors$/ },
} as const;

export type UserKey = keyof typeof USERS;

export function storageStateFor(key: UserKey): string {
    return path.join(FRONTEND_DIR, 'e2e', '.auth', `${key}.json`);
}
