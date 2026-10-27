import { expect, test } from "@playwright/test";
import path from "node:path";
import { FIXTURES_DIR } from "./support/env";
import { storageStateFor } from "./support/users";

// Fluxo central, na ordem em que o usuário percorre: cada passo depende do anterior.
test.describe.configure({ mode: 'serial' });

// demonstrativo-valido.xml: 4 guias, 6 glosas (fixture fictícia).
const FIXTURE = 'demonstrativo-valido.xml';
let denialPath = '';

test.describe('dona da clínica', () => {
    test.use({ storageState: storageStateFor('owner') });

    test('upload do demonstrativo é processado', async ({ page }) => {
        await page.goto('/upload');
        await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES_DIR, FIXTURE));

        const row = page.getByRole('row').filter({ hasText: FIXTURE });
        await expect(row.getByText('Processado')).toBeVisible({ timeout: 15_000 });
    });

    test('as 6 glosas aparecem na lista', async ({ page }) => {
        await page.goto('/denials');
        await expect(page.locator('tbody tr')).toHaveCount(6);
    });

    test('gerar, editar e salvar o recurso persiste após recarregar', async ({ page }) => {
        await page.goto('/denials');
        await page.locator('tbody tr').first().click();
        await expect(page).toHaveURL(/\/denials\/\d+$/);
        denialPath = new URL(page.url()).pathname;

        const editor = page.getByPlaceholder('Escreva o texto do recurso de defesa...');
        await page.getByRole('button', { name: 'Gerar recurso' }).click();
        await expect(page.getByText('Modelo aplicado:')).toBeVisible();
        await expect(editor).not.toHaveValue('');

        // Fim do texto inteiro, não só da linha: Control+End (Meta+ArrowDown no Mac).
        await editor.press(process.platform === 'darwin' ? 'Meta+ArrowDown' : 'Control+End');
        await editor.pressSequentially('\nObservação E2E.');
        await page.getByRole('button', { name: 'Salvar', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Salvo', exact: true })).toBeVisible();

        await page.reload();
        await expect(editor).toHaveValue(/Observação E2E\.$/);
    });

    test('status da glosa oferece as 5 opções e grava a escolhida', async ({ page }) => {
        await page.goto(denialPath);
        const status = page.locator('select').filter({ has: page.locator('option', { hasText: 'Contestada' }) });

        await expect(status.locator('option')).toHaveText(['Nova', 'Pendente', 'Contestada', 'Recuperada', 'Negada']);
        const saved = page.waitForResponse((res) => res.url().includes(`/api${denialPath}`) && res.request().method() === 'PUT');
        await status.selectOption({ label: 'Pendente' });
        expect((await saved).status()).toBe(200);

        await page.reload();
        await expect(status).toHaveValue('pending');
    });
});

test.describe('outra clínica', () => {
    test.use({ storageState: storageStateFor('otherClinic') });

    test('não vê as glosas da primeira clínica', async ({ page }) => {
        // Espera a resposta da API antes de contar: sem isso a tabela ainda vazia (carregando)
        // passaria mesmo com vazamento. Prova em duas camadas: payload e tela.
        const response = page.waitForResponse((res) => /\/api\/denials(\?|$)/.test(res.url()) && res.request().method() === 'GET');
        await page.goto('/denials');
        const body = await (await response).json();

        const rows = Array.isArray(body) ? body : body.data;
        expect(rows).toEqual([]);
        await expect(page.locator('tbody tr').filter({ hasText: /R\$/ })).toHaveCount(0);
    });

    test('não abre a glosa da primeira clínica pela URL', async ({ page }) => {
        const response = page.waitForResponse((res) => res.url().includes(`/api${denialPath}`) && res.request().method() === 'GET');
        await page.goto(denialPath);

        expect((await response).status()).toBe(404);
        await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveCount(0);
    });
});
