import { expect, test } from "@playwright/test";
import { storageStateFor } from "./support/users";

test.describe('sem sessão', () => {
    test('rota protegida manda para o login', async ({ page }) => {
        await page.goto('/denials');
        await expect(page).toHaveURL(/\/login$/);
    });

    test('senha errada mostra erro e não entra', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('E-mail').fill('ana@clinica-exemplo.com');
        await page.getByPlaceholder('Senha').fill('senha-errada');
        await page.getByRole('button', { name: 'Entrar' }).click();

        await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });
});

test.describe('com sessão', () => {
    test.use({ storageState: storageStateFor('owner') });

    test('recarregar mantém logado', async ({ page }) => {
        await page.goto('/dashboard');
        await page.reload();
        await expect(page).toHaveURL(/\/dashboard$/);
    });
});
