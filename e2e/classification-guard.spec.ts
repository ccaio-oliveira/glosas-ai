import { expect, test, type Page } from "@playwright/test";
import { storageStateFor } from "./support/users";

// GL-TISS-004A: cada glosa do E2eSeeder numa situação de classificação. Clínica própria,
// para não mexer nas contagens dos outros specs.
test.describe.configure({ mode: 'serial' });
test.use({ storageState: storageStateFor('classification') });

async function openDenial(page: Page, claimNumber: string) {
    await page.goto('/denials');
    await page.getByPlaceholder('Buscar por paciente, guia, convênio...').fill(claimNumber);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.locator('tbody tr').first().click();
    await expect(page.getByText('Motivo da glosa')).toBeVisible();
}

const generate = (page: Page) => page.getByRole('button', { name: 'Gerar recurso' }).click();

test('classificação desatualizada: avisa, recusa a geração e mostra a redação atual', async ({ page }) => {
    await openDenial(page, 'DESATUALIZADA');

    await expect(page.getByText('(Não classificada) está desatualizada: no catálogo atual é Administrativa', { exact: false })).toBeVisible();
    await expect(page.getByText('Descrição atual na Tabela 38: ATENDIMENTO DENTRO DA CARÊNCIA DO BENEFICIÁRIO')).toBeVisible();
    await expect(page.getByText('Código não catalogado na Tabela 38')).toHaveCount(0);

    await generate(page);
    await expect(page.getByText('diverge da classificação atual do código 3171', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue('');
});

test('o recurso manual da glosa bloqueada é salvo e continua depois de recarregar', async ({ page }) => {
    await openDenial(page, 'DESATUALIZADA');

    await page.getByPlaceholder('Escreva o texto do recurso de defesa...').fill('Recurso redigido pela faturista.');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('button', { name: 'Salvo' })).toBeVisible();

    await page.reload();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue('Recurso redigido pela faturista.');

    // A recusa da geração não apaga o que já foi escrito.
    await generate(page);
    await expect(page.getByText('diverge da classificação atual', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue('Recurso redigido pela faturista.');
});

test('código oficial sem classificação: aviso próprio, sem falar em "não catalogado"', async ({ page }) => {
    await openDenial(page, 'SEMCLASSIF');

    await expect(page.getByText('Código da Tabela 38 ainda sem classificação no GlosasAI', { exact: false })).toBeVisible();
    await expect(page.getByText('Código não catalogado na Tabela 38')).toHaveCount(0);

    await generate(page);
    await expect(page.getByText('O código 3172 está na Tabela 38, mas ainda não tem classificação', { exact: false })).toBeVisible();
});

test('código realmente fora do catálogo: aviso próprio e modelo genérico', async ({ page }) => {
    await openDenial(page, 'NAOCATALOGADO');

    await expect(page.getByText('Código não catalogado na Tabela 38', { exact: false })).toBeVisible();

    await generate(page);
    await expect(page.getByText('Modelo aplicado:', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue(/não corresponde a nenhum termo da Tabela 38/);
});

test('código fora de vigência segue bloqueado', async ({ page }) => {
    await openDenial(page, 'FORAVIGENCIA');

    await expect(page.getByText('Código fora de vigência na Tabela 38', { exact: false })).toBeVisible();

    await generate(page);
    await expect(page.getByText('O código 3052 não estava vigente na Tabela 38', { exact: false })).toBeVisible();
});

test('3095: avisa sem afirmar além da redação e não gera', async ({ page }) => {
    await openDenial(page, 'ACATADO');

    await expect(page.getByText('que não descreve uma recusa', { exact: false })).toBeVisible();

    await generate(page);
    await expect(page.getByText('indica aceite de recurso', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue('');
});

test('código vigente e coerente gera pelo modelo próprio, sem aviso', async ({ page }) => {
    await openDenial(page, 'COERENTE');

    await expect(page.getByText('está desatualizada', { exact: false })).toHaveCount(0);

    await generate(page);
    await expect(page.getByText('Radiografia inicial não enviada', { exact: false }).first()).toBeVisible();
    await expect(page.getByPlaceholder('Escreva o texto do recurso de defesa...')).toHaveValue(/Segue anexa a radiografia inicial/);
});

test('a glosa de outra clínica não abre', async ({ page, browser }) => {
    await openDenial(page, 'COERENTE');
    const url = page.url();

    const other = await browser.newContext({ storageState: storageStateFor('otherClinic') });
    const intruder = await other.newPage();
    const denialRequest = intruder.waitForResponse((r) => /\/api\/denials\/\d+$/.test(r.url()));
    await intruder.goto(url);

    expect((await denialRequest).status()).toBe(404);
    await expect(intruder.getByText('Radiografia inicial não enviada')).toHaveCount(0);
    await other.close();
});
