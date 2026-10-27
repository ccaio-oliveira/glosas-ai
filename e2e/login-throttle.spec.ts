import { expect, test } from "@playwright/test";

// GL-A2: 5 tentativas/min por e-mail+IP. E-mail inexistente e exclusivo deste spec,
// para não bloquear as contas de seed usadas pelos outros.
test('6ª tentativa seguida mostra o bloqueio com o tempo de espera', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('E-mail').fill('bloqueio-e2e@teste.invalid');
    await page.getByPlaceholder('Senha').fill('errada');
    const submit = page.getByRole('button', { name: 'Entrar' });

    // Espera cada resposta: a mensagem da 1ª tentativa continua na tela, então checar só
    // o texto deixaria os cliques correrem à frente do contador do servidor.
    for (let attempt = 1; attempt <= 5; attempt++) {
        const rejected = page.waitForResponse((res) => res.url().endsWith('/api/login'));
        await submit.click();
        expect((await rejected).status()).toBe(422);
    }
    await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible();

    const blocked = page.waitForResponse((res) => res.url().endsWith('/api/login') && res.status() === 429);
    await submit.click();
    const response = await blocked;

    expect(Number(response.headers()['retry-after'])).toBeGreaterThan(0);
    await expect(page.getByText(/Muitas tentativas de login\. Tente novamente em \d+ segundos\./)).toBeVisible();
});
