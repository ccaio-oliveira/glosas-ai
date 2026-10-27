import { expect, test as setup } from "@playwright/test";
import { SESSION_COOKIE } from "./support/env";
import { USERS, type UserKey, storageStateFor } from "./support/users";

// Um login por usuário, salvo em e2e/.auth/. Os specs reaproveitam a sessão e não
// gastam o limite de 5 tentativas/min do /login.
for (const key of Object.keys(USERS) as UserKey[]) {
    setup(`login: ${key}`, async ({ page }) => {
        const user = USERS[key];

        await page.goto('/login');
        await page.getByPlaceholder('E-mail').fill(user.email);
        await page.getByPlaceholder('Senha').fill(user.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page).toHaveURL(user.home);

        // Prova de identidade: a sessão veio do backend E2E, não de outro app em localhost.
        const cookies = await page.context().cookies();
        expect(cookies.map((c) => c.name)).toContain(SESSION_COOKIE);

        await page.context().storageState({ path: storageStateFor(key) });
    });
}
