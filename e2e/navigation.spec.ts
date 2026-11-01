import { expect, test, type Page } from "@playwright/test";
import { storageStateFor } from "./support/users";

test.use({ storageState: storageStateFor('owner') });

// Toda tela operacional precisa de entrada fixa no menu. Guias e Convênios já
// ficaram de fora uma vez, alcançáveis só por link contextual.
const ITEMS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Glosas', path: '/denials' },
    { label: 'Recursos', path: '/appeals' },
    { label: 'Upload TISS', path: '/upload' },
    { label: 'Guias', path: '/claims' },
    { label: 'Convênios', path: '/payers' },
    { label: 'Fat. Preventivo', path: '/preventive' },
    { label: 'Relatórios', path: '/reports' },
    { label: 'Configurações', path: '/settings' },
];

async function walkMenu(page: Page) {
    await page.goto('/dashboard');

    for (const { label, path } of ITEMS) {
        // Âncora no início: o badge de contagem entra no nome ("Glosas 6").
        const link = page.getByRole('link', { name: new RegExp(`^${label.replace('.', '\\.')}`) });
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(link).toHaveAttribute('aria-current', 'page');
        // Só um item marcado como ativo por vez.
        await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);
    }
}

test('menu leva a todas as telas e marca a ativa', async ({ page }) => {
    await walkMenu(page);
});

test('menu funciona em tela de celular', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await walkMenu(page);
});
