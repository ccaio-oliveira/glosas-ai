import { expect, test } from "@playwright/test";
import path from "node:path";
import { FIXTURES_DIR } from "./support/env";
import { storageStateFor } from "./support/users";

// Demonstrativo odontológico TISS 4.03 (GL-TISS-002), fixture fictícia validada no XSD:
// 3 guias, 2 glosas (uma com dois códigos), sem nome de beneficiário no arquivo.
// Roda na "Clínica Isolamento" para não mexer nas contagens dos specs da clínica principal.
test.describe.configure({ mode: 'serial' });
test.use({ storageState: storageStateFor('otherClinic') });

const FIXTURE = 'demonstrativo-odonto-com-glosas.xml';

test('upload do demonstrativo odontológico 4.03 é processado', async ({ page }) => {
    await page.goto('/upload');
    await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES_DIR, 'v4_03', FIXTURE));

    const row = page.getByRole('row').filter({ hasText: FIXTURE });
    await expect(row.getByText('Processado')).toBeVisible({ timeout: 15_000 });
});

test('as 2 glosas aparecem sem nome inventado', async ({ page }) => {
    await page.goto('/denials');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('tbody').getByText('Não informado no XML')).toHaveCount(2);
});

test('detalhe mostra a carteira e os dois códigos do item', async ({ page }) => {
    await page.goto('/denials');
    // Sem nome no arquivo, a carteira é o que o faturista tem para procurar.
    await page.getByPlaceholder('Buscar por paciente, guia, convênio...').fill('CART000000001');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.locator('tbody tr').first().click();

    await expect(page.getByText('CART000000001')).toBeVisible();
    await expect(page.getByText('3054, 3172')).toBeVisible();
    // GL-TISS-003: vigência conferida na data de emissão do demonstrativo (2026-10-20).
    await expect(page.getByText('Código vigente na Tabela 38 em 20/10/2026', { exact: false })).toBeVisible();
});
