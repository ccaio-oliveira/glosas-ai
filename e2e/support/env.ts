import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Ambiente E2E: portas e caminhos fixos, sem variável de shell que os sobrescreva.
// Specs usam só caminhos relativos (baseURL); nunca apontar para 5173/8000 (dev).
export const SPA_PORT = 5193;
export const API_PORT = 8021;
export const SPA_URL = `http://localhost:${SPA_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;
export const SESSION_COOKIE = 'glosas_e2e_session';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FRONTEND_DIR = path.resolve(here, '../..');
export const API_DIR = path.resolve(FRONTEND_DIR, '../glosas-api');
export const E2E_DB = path.join(API_DIR, 'database', 'e2e.sqlite');
export const E2E_STORAGE = path.join(API_DIR, 'storage', 'e2e');
export const FIXTURES_DIR = path.join(API_DIR, 'tests', 'fixtures', 'tiss');

/**
 * Env do processo PHP montado do zero (allowlist), nunca herdando process.env:
 * DB_*, DB_URL, APP_KEY etc. exportados no shell venceriam o .env.e2e, porque o
 * Dotenv do Laravel não sobrescreve variável que já existe.
 */
export function apiEnv(): Record<string, string> {
    const env: Record<string, string> = {
        APP_ENV: 'e2e',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: E2E_DB,
        DB_URL: '',
        LARAVEL_STORAGE_PATH: E2E_STORAGE,
        PHP_CLI_SERVER_WORKERS: '4',
    };

    for (const key of ['PATH', 'HOME', 'TMPDIR', 'LANG']) {
        const value = process.env[key];
        if (value !== undefined) env[key] = value;
    }

    return env;
}

/** Env do Vite: idem, só o necessário para o Node rodar e a URL da API do E2E. */
export function spaEnv(): Record<string, string> {
    const env: Record<string, string> = { VITE_API_URL: API_URL };

    for (const key of ['PATH', 'HOME', 'TMPDIR', 'LANG']) {
        const value = process.env[key];
        if (value !== undefined) env[key] = value;
    }

    return env;
}

export function prepareStorage(): void {
    for (const dir of ['framework/cache/data', 'framework/sessions', 'framework/views', 'logs', 'app/private']) {
        mkdirSync(path.join(E2E_STORAGE, dir), { recursive: true });
    }
}

export function artisan(args: string[]): string {
    return execFileSync('php', ['artisan', ...args, '--env=e2e'], {
        cwd: API_DIR,
        env: apiEnv(),
        encoding: 'utf8',
    });
}

interface EffectiveConfig {
    env: string;
    default: string;
    sqlite: string;
    url: string | null;
    storage: string;
    cached: boolean;
}

/**
 * Guarda contra apagar o banco errado. Lê a config efetiva com o MESMO env e o mesmo
 * --env do migrate, e aborta se qualquer ponto divergir. Não tenta corrigir nada.
 */
export function assertIsolatedEnvironment(): void {
    const fail = (reason: string): never => {
        throw new Error(`[e2e] Ambiente não isolado, abortando antes de tocar no banco: ${reason}`);
    };

    if (!existsSync(path.join(API_DIR, '.env.e2e'))) fail('glosas-api/.env.e2e não existe');
    if (existsSync(path.join(API_DIR, 'bootstrap', 'cache', 'config.php'))) {
        fail('existe bootstrap/cache/config.php (config em cache ignora .env.e2e); rode config:clear no dev');
    }

    const out = artisan([
        'tinker',
        '--execute=echo json_encode(["env" => app()->environment(), "default" => config("database.default"), '
            + '"sqlite" => config("database.connections.sqlite.database"), "url" => config("database.connections.sqlite.url"), '
            + '"storage" => storage_path(), "cached" => app()->configurationIsCached()]);',
    ]);

    let config: EffectiveConfig;
    try {
        config = JSON.parse(out.trim().split('\n').pop() ?? '');
    } catch {
        return fail(`não consegui ler a config efetiva: ${out.slice(0, 200)}`);
    }

    if (config.env !== 'e2e') fail(`app.env = ${config.env}`);
    if (config.default !== 'sqlite') fail(`database.default = ${config.default}`);
    if (path.resolve(config.sqlite ?? '') !== E2E_DB) fail(`sqlite aponta para ${config.sqlite}`);
    if (config.url) fail('DB_URL definido');
    if (path.resolve(config.storage) !== E2E_STORAGE) fail(`storage em ${config.storage}`);
    if (config.cached) fail('configuração em cache');
}
