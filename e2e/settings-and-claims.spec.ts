import { expect, test } from "@playwright/test";
import { field } from "./support/ui";
import { storageStateFor } from "./support/users";

test.use({ storageState: storageStateFor('owner') });

test('dados da clínica: editar e salvar persiste após recarregar', async ({ page }) => {
    await page.goto('/settings');
    const name = field(page, 'Nome da clínica');
    await expect(name).toHaveValue('Clínica Exemplo');

    await field(page, 'Telefone').fill('(11) 4000-0000');
    const saved = page.waitForResponse((res) => res.url().endsWith('/api/clinic') && res.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    expect((await saved).status()).toBe(200);

    await page.reload();
    await expect(field(page, 'Telefone')).toHaveValue('(11) 4000-0000');
    await expect(name).toHaveValue('Clínica Exemplo');
});

test('guias: criar e depois editar', async ({ page }) => {
    await page.goto('/claims');
    await page.getByRole('button', { name: 'Nova Guia' }).click();

    // O convênio vem do demonstrativo enviado em denial-flow.spec.ts ou do catálogo.
    const payer = field(page, 'Convênio');
    // "Selecione..." + ao menos um convênio.
    await expect.poll(() => payer.locator('option').count()).toBeGreaterThan(1);
    await payer.selectOption({ index: 1 });
    await field(page, 'Número da guia').fill('E2E-0001');
    await field(page, 'Nome do paciente').fill('Paciente Fictício E2E');
    await field(page, 'Data do atendimento').fill('2026-10-01');
    await field(page, 'Valor total (R$)').fill('150');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();

    const row = page.getByRole('row').filter({ hasText: 'E2E-0001' });
    await expect(row).toContainText('Paciente Fictício E2E');

    await row.getByRole('button', { name: 'Editar' }).click();
    await field(page, 'Nome do paciente').fill('Paciente Editado E2E');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(page.getByRole('row').filter({ hasText: 'E2E-0001' })).toContainText('Paciente Editado E2E');
});
