import { expect, test } from "@playwright/test";
import path from "node:path";
import { FIXTURES_DIR } from "./support/env";
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

    // Achado M6 da auditoria (2026-10-26), confirmado aqui: o super_admin lê as glosas de
    // todas as clínicas em /denials (scope de tenant desligado + Gate::before). Aguarda
    // decisão do Product Owner. test.fail() mantém a suíte verde e avisa quando o
    // comportamento mudar ("expected to fail, but passed") — aí remova a marcação.
    // Só a asserção do vazamento fica aqui, para o test.fail() não esconder outra falha.
    // Depende de denial-flow.spec.ts ter criado glosas antes (ordem alfabética, 1 worker):
    // rodado sozinho o banco não tem glosas e ele acusa "passed" — falso alarme.
    test('/api/denials não devolve glosas de clínica ao super_admin', async ({ page }) => {
        test.fail();

        const response = page.waitForResponse((res) => /\/api\/denials(\?|$)/.test(res.url()) && res.request().method() === 'GET');
        await page.goto('/denials');
        const body = await (await response).json();

        expect(Array.isArray(body) ? body : body.data).toEqual([]);
    });
});
