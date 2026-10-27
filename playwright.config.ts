import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { API_DIR, API_PORT, SPA_PORT, SPA_URL, apiEnv, prepareStorage, spaEnv } from "./e2e/support/env";

// O webServer do Playwright MESCLA env com process.env; `env -i` garante que o servidor
// só receba a allowlist de e2e/support/env.ts (shell não vence o .env.e2e).
const withEnv = (env: Record<string, string>, command: string) =>
    `env -i ${Object.entries(env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')} ${command}`;

// /up renderiza view: o storage isolado precisa existir antes do servidor subir.
prepareStorage();

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    // Banco único e compartilhado entre specs: execução serial e determinística.
    workers: 1,
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: SPA_URL,
        locale: 'pt-BR',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    ],
    webServer: [
        {
            command: withEnv(apiEnv(), `php -S 127.0.0.1:${API_PORT} ${path.join(API_DIR, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')}`),
            cwd: path.join(API_DIR, 'public'),
            url: `http://127.0.0.1:${API_PORT}/up`,
            // Nunca reaproveitar: se a porta estiver ocupada, falha em vez de testar outra coisa.
            reuseExistingServer: false,
            timeout: 30_000,
            // O php -S loga cada conexão no stderr; erros da aplicação ficam em
            // glosas-api/storage/e2e/logs/laravel.log.
            stderr: 'ignore',
        },
        {
            command: withEnv(spaEnv(), `npx vite --port ${SPA_PORT} --strictPort --host localhost`),
            url: SPA_URL,
            reuseExistingServer: false,
            timeout: 30_000,
        },
    ],
});
