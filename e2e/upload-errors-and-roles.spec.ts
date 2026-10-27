import { expect, test } from "@playwright/test";
import path from "node:path";
import { API_URL, FIXTURES_DIR, SPA_URL } from "./support/env";
import { storageStateFor } from "./support/users";

test.describe('upload de arquivo inválido (dona da clínica)', () => {
    test.use({ storageState: storageStateFor('owner') });

    test('arquivo-invalido.xml mostra erro na tela sem quebrar a página', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));

        await page.goto('/upload');
        await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES_DIR, 'arquivo-invalido.xml'));

        // Fila síncrona no E2E: a exceção do job volta como 500 no POST (em produção o
        // worker marcaria o upload como "Falhou"). Aqui só se prova o que o E2E alcança:
        // mensagem de erro na tela, sem tela branca e com o envio disponível de novo.
        await expect(page.getByText('Não foi possível enviar o arquivo.')).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('input[type="file"]')).toBeAttached();
        await expect(page.getByText('Arquivos importados')).toBeVisible();
        expect(pageErrors).toEqual([]);
    });
});

test.describe('operador da SaaS (super_admin)', () => {
    test.use({ storageState: storageStateFor('superAdmin') });

    test('raiz cai em /admin/errors', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));

        await page.goto('/');
        await expect(page).toHaveURL(/\/admin\/errors$/);
        expect(pageErrors).toEqual([]);
    });

    // Achado M6 (corrigido em 2026-10-27): o super_admin não acessa as telas nem a API
    // da clínica. A tela só redireciona; quem barra de fato é a API (403).
    test('tela da clínica redireciona para o painel, sem chamar /api/denials', async ({ page }) => {
        const denialCalls: string[] = [];
        page.on('request', (req) => { if (/\/api\/denials/.test(req.url())) denialCalls.push(req.url()); });

        await page.goto('/denials');
        await expect(page).toHaveURL(/\/admin\/errors$/);
        expect(denialCalls).toEqual([]);
    });

    test('API da clínica responde 403 e o painel continua acessível', async ({ page }) => {
        // Referer do SPA: sem ele o Sanctum não trata a chamada como sessão (daria 401).
        const headers = { Accept: 'application/json', Referer: `${SPA_URL}/` };

        for (const path of ['/api/denials', '/api/claims', '/api/reports/recovery', '/api/clinic']) {
            const res = await page.request.get(`${API_URL}${path}`, { headers });
            expect(res.status(), path).toBe(403);
        }
        expect((await page.request.get(`${API_URL}/api/admin/error-logs`, { headers })).status()).toBe(200);
    });
});
