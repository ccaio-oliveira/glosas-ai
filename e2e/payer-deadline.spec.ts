import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { API_URL, E2E_DB, SPA_URL } from "./support/env";
import { field } from "./support/ui";
import { storageStateFor } from "./support/users";

// GL-PRZ-001: prazo de recurso por convênio. Fluxo serial; cada passo usa o estado do anterior.
test.describe.configure({ mode: 'serial' });
test.use({ storageState: storageStateFor('owner') });

const SOURCE = 'Contrato 2025, cláusula 7.3';
const XSS = '<script>alert(1)</script>';
const headers = { Accept: 'application/json', Referer: `${SPA_URL}/` };

let consoleErrors: string[] = [];
let dialogs: string[] = [];
let payerA = '';
let payerB = '';
let viewerPassword = '';
const viewerEmail = `viewer-prz@clinica-exemplo.test`;

test.beforeEach(({ page }) => {
    consoleErrors = [];
    dialogs = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
});

test.afterEach(() => {
    expect(dialogs, 'nenhum alert deve executar').toEqual([]);
    // Ruído fora do escopo: 401 do /api/user na tela de login (sessão ainda inexistente) e o aviso
    // de input controlado vindo de /settings (painel de usuários/clínica), não das telas de prazo.
    const relevant = consoleErrors.filter((e) => !/status of 401|uncontrolled input/.test(e));
    expect(relevant, 'console limpo').toEqual([]);
});

function todayBR(): string {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}

async function bannerCount(page: Page): Promise<number> {
    const text = await page.getByText(/glosa\(s\) em aberto sem prazo de recurso configurado/).innerText();
    return Number(text.match(/^(\d+)/)![1]);
}

const payerRow = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name }).first();

async function saveEdit(page: Page, label = 'Salvar') {
    const res = page.waitForResponse((r) => /\/api\/payers\/\d+$/.test(r.url()) && r.request().method() === 'PUT');
    await page.getByRole('button', { name: label, exact: true }).click();
    return res;
}

// Fixtures próprias: o denial-flow.spec.ts roda antes e envia o demonstrativo-valido.xml;
// o mesmo arquivo aqui dá 409 por content_hash e o spec testaria as glosas de outro spec.
const OWN_FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('setup: upload dos dois demonstrativos', async ({ page }) => {
    await page.goto('/upload');
    for (const f of ['demonstrativo-prazo-a.xml', 'demonstrativo-prazo-b.xml']) {
        await page.locator('input[type="file"]').setInputFiles(path.join(OWN_FIXTURES_DIR, f));
        await expect(page.getByRole('row').filter({ hasText: f }).getByText('Processado')).toBeVisible({ timeout: 15_000 });
    }
});

test('1. Dashboard: aviso, "Ver glosas" bate com N, "Configurar convênios" leva a /payers', async ({ page }) => {
    await page.goto('/dashboard');
    const n = await bannerCount(page);
    console.log('N sem prazo no Dashboard =', n);
    expect(n).toBeGreaterThan(0);

    await page.getByRole('link', { name: 'Ver glosas' }).click();
    await expect(page).toHaveURL(/\/denials\?deadline=not_configured$/);
    await expect(page.locator('tbody tr')).toHaveCount(n);
    await expect(page.getByText(`${n} resultado(s)`)).toBeVisible();

    await page.goBack();
    await page.getByRole('link', { name: 'Configurar convênios' }).click();
    await expect(page).toHaveURL(/\/payers$/);
});

test('2. editar convênio: fonte obrigatória inline sem requisição; salva; aviso diminui sem recarregar', async ({ page }) => {
    await page.goto('/dashboard');
    const before = await bannerCount(page);
    await page.getByRole('link', { name: 'Configurar convênios' }).click(); // navegação SPA, sem reload

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    payerA = (await rows.nth(0).locator('td').first().innerText()).trim();
    payerB = (await rows.nth(1).locator('td').first().innerText()).trim();
    console.log('convênios:', payerA, '|', payerB);
    await expect(payerRow(page, payerA)).toContainText('Não configurado');

    await payerRow(page, payerA).getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByText('Prazo para recurso (dias corridos)', { exact: true })).toBeVisible();
    await expect(page.getByText('Fonte do prazo', { exact: true })).toBeVisible();

    const puts: string[] = [];
    page.on('request', (r) => { if (r.method() === 'PUT' && r.url().includes('/api/payers')) puts.push(r.url()); });

    await field(page, 'Prazo para recurso (dias corridos)').fill('30');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Informe a fonte do prazo')).toBeVisible();
    await page.waitForTimeout(500);
    expect(puts, 'nenhuma requisição PUT com fonte vazia').toEqual([]);

    // só espaços também é vazio
    await field(page, 'Fonte do prazo').fill('   ');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Informe a fonte do prazo')).toBeVisible();
    expect(puts).toEqual([]);

    await field(page, 'Fonte do prazo').fill(SOURCE);
    expect((await saveEdit(page)).status()).toBe(200);

    const row = payerRow(page, payerA);
    await expect(row).toContainText('30 dias corridos');
    await expect(row).toContainText(SOURCE);
    await expect(row).toContainText(`Atualizado em ${todayBR()} por `);
    console.log('célula:', (await row.locator('td').nth(3).innerText()).replace(/\n/g, ' / '));

    // volta por histórico (SPA, sem reload): o aviso deve ter diminuído
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect.poll(() => bannerCount(page)).toBeLessThan(before);
    console.log('aviso antes/depois:', before, '->', await bannerCount(page));
});

test('4. detalhe: glosa de convênio configurado e de convênio sem prazo', async ({ page }) => {
    const list = await (await page.request.get(`${API_URL}/api/denials`, { headers })).json();
    const rows: Array<{ id: number }> = Array.isArray(list) ? list : list.data;
    let configured: number | null = null;
    let notConfigured: number | null = null;
    for (const r of rows) {
        const d = await (await page.request.get(`${API_URL}/api/denials/${r.id}`, { headers })).json();
        const body = d.data ?? d;
        if (body.deadline.status === 'not_configured') notConfigured ??= r.id;
        else if (body.deadline.deadline_days === 30) configured ??= r.id;
    }
    expect(configured, 'existe glosa do convênio configurado').not.toBeNull();
    expect(notConfigured, 'existe glosa do convênio sem prazo').not.toBeNull();

    await page.goto(`/denials/${configured}`);
    await expect(page.getByText(`30 dias corridos a partir da identificação · Fonte: ${SOURCE}`)).toBeVisible();
    const title = await page.locator('span[title^="Vence em"]').first().getAttribute('title');
    console.log('tooltip:', title);
    expect(title).toMatch(/^Vence em \d{2}\/\d{2}\/\d{4} · prazo de 30 dias corridos$/);

    await page.goto(`/denials/${notConfigured}`);
    await expect(page.getByText('Prazo não cadastrado para este convênio — consulte o contrato.')).toBeVisible();
    await page.getByRole('link', { name: 'Configurar prazo' }).click();
    await expect(page).toHaveURL(/\/payers$/);
});

test('5. fonte com <script> aparece como texto literal e nada executa', async ({ page }) => {
    await page.goto('/payers');
    await payerRow(page, payerA).getByRole('button', { name: 'Editar' }).click();
    await field(page, 'Fonte do prazo').fill(XSS);
    expect((await saveEdit(page)).status()).toBe(200);
    await expect(payerRow(page, payerA)).toContainText(XSS);
    expect(await page.locator('tbody script').count()).toBe(0);

    const list = await (await page.request.get(`${API_URL}/api/denials`, { headers })).json();
    const rows: Array<{ id: number }> = Array.isArray(list) ? list : list.data;
    for (const r of rows) {
        const d = await (await page.request.get(`${API_URL}/api/denials/${r.id}`, { headers })).json();
        if ((d.data ?? d).deadline.deadline_days === 30) {
            await page.goto(`/denials/${r.id}`);
            await expect(page.getByText(`Fonte: ${XSS}`)).toBeVisible();
            expect(await page.locator('main script, p script').count()).toBe(0);
            break;
        }
    }
    await page.waitForTimeout(500);
});

test('6. visualizador: sem links de configurar, sem "por {nome}", escrita 403', async ({ page, browser }) => {
    // cria o viewer pela UI da dona
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Usuários' }).click();
    await page.getByRole('button', { name: '+ Convidar' }).click();
    await field(page, 'Nome').fill('Viewer Prazo E2E');
    await field(page, 'E-mail').fill(viewerEmail);
    await field(page, 'Papel').selectOption({ label: 'Visualizador' });
    await page.getByRole('button', { name: 'Convidar', exact: true }).click();
    const pwd = page.locator('p.font-mono');
    await expect(pwd).toBeVisible();
    viewerPassword = (await pwd.innerText()).trim();

    const ctx = await browser.newContext({ storageState: undefined, baseURL: SPA_URL });
    const v = await ctx.newPage();
    const vErrors: string[] = [];
    v.on('console', (m) => { if (m.type() === 'error') vErrors.push(m.text()); });
    await v.goto('/login');
    await v.getByPlaceholder('E-mail').fill(viewerEmail);
    await v.getByPlaceholder('Senha').fill(viewerPassword);
    await v.getByRole('button', { name: 'Entrar' }).click();
    await expect(v).toHaveURL(/\/dashboard$/);

    await expect(v.getByText(/glosa\(s\) em aberto sem prazo/)).toBeVisible();
    await expect(v.getByRole('link', { name: 'Ver glosas' })).toBeVisible();
    await expect(v.getByRole('link', { name: 'Configurar convênios' })).toHaveCount(0);

    await v.goto('/payers');
    await expect(v.getByText(payerA).first()).toBeVisible();
    await expect(v.getByText('30 dias corridos')).toBeVisible();
    await expect(v.getByText(/Atualizado em/)).toBeVisible();
    await expect(v.getByText(/ por /)).toHaveCount(0);
    await expect(v.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    await expect(v.getByRole('button', { name: 'Excluir' })).toHaveCount(0);
    await expect(v.getByRole('button', { name: 'Novo convênio' })).toHaveCount(0);

    // API direta: nome de quem atualizou não vem no payload e escrita é 403
    const xsrf = decodeURIComponent((await ctx.cookies()).find((c) => c.name === 'XSRF-TOKEN')!.value);
    const h = { ...headers, 'X-XSRF-TOKEN': xsrf, 'Content-Type': 'application/json' };
    const payers = await (await v.request.get(`${API_URL}/api/payers`, { headers })).json();
    expect(JSON.stringify(payers)).not.toMatch(/Ana/);
    expect(payers.every((p: { appeal_deadline_updated_by: unknown }) => p.appeal_deadline_updated_by === null)).toBe(true);
    const id = payers[0].id;
    const put = await v.request.put(`${API_URL}/api/payers/${id}`, { headers: h, data: { name: 'x', integration_type: 'manual', appeal_deadline_days: 5, appeal_deadline_source: 'x' } });
    const del = await v.request.delete(`${API_URL}/api/payers/${id}`, { headers: h });
    const post = await v.request.post(`${API_URL}/api/payers`, { headers: h, data: { name: 'x', integration_type: 'manual' } });
    console.log('viewer PUT/DELETE/POST:', put.status(), del.status(), post.status());
    expect([put.status(), del.status(), post.status()]).toEqual([403, 403, 403]);

    // detalhe de glosa sem prazo: texto sem link
    await v.goto('/denials?deadline=not_configured');
    await v.locator('tbody tr').first().click();
    await expect(v.getByText('Prazo não cadastrado para este convênio — consulte o contrato.')).toBeVisible();
    await expect(v.getByRole('link', { name: 'Configurar prazo' })).toHaveCount(0);
    expect(vErrors.filter((e) => !/status of (401|403)/.test(e))).toEqual([]);
    await ctx.close();
});

test('3. limpar o prazo salva "Não configurado" e a fonte some', async ({ page }) => {
    await page.goto('/payers');
    await payerRow(page, payerA).getByRole('button', { name: 'Editar' }).click();
    await field(page, 'Prazo para recurso (dias corridos)').fill('');
    expect((await saveEdit(page)).status()).toBe(200);
    const row = payerRow(page, payerA);
    await expect(row).toContainText('Não configurado');
    await expect(row).not.toContainText(XSS);
    await expect(row).not.toContainText('Atualizado em');
    await page.reload();
    await expect(payerRow(page, payerA)).toContainText('Não configurado');
});

test('legado: prazo sem fonte permite editar só o nome; excluir convênio com prazo não mostra erro', async ({ page }) => {
    await page.goto('/payers');
    const list = await (await page.request.get(`${API_URL}/api/payers`, { headers })).json();
    const b = list.find((p: { name: string }) => p.name === payerB);
    // Prazo legado só existe por dado antigo: grava direto no sqlite DESCARTÁVEL do E2E.
    execFileSync('sqlite3', [E2E_DB, `UPDATE clinic_payers SET config = json_set(coalesce(config,'{}'),'$.appeal_deadline_days',20,'$.appeal_deadline_source',json('null')) WHERE id=${b.id};`]);

    await page.reload();
    await expect(payerRow(page, payerB)).toContainText('20 dias corridos');
    await expect(payerRow(page, payerB)).toContainText('Fonte não informada');

    await payerRow(page, payerB).getByRole('button', { name: 'Editar' }).click();
    const newName = `${payerB} Renomeado`;
    await field(page, 'Nome').fill(newName);
    expect((await saveEdit(page)).status()).toBe(200);
    await expect(page.getByText('Informe a fonte do prazo')).toHaveCount(0);
    await expect(payerRow(page, newName)).toContainText('20 dias corridos');

    // mudar o prazo de um legado volta a exigir a fonte
    await payerRow(page, newName).getByRole('button', { name: 'Editar' }).click();
    await field(page, 'Prazo para recurso (dias corridos)').fill('25');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByText('Informe a fonte do prazo')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // excluir com prazo
    const del = page.waitForResponse((r) => /\/api\/payers\/\d+$/.test(r.url()) && r.request().method() === 'DELETE');
    await payerRow(page, newName).getByRole('button', { name: 'Excluir' }).click();
    const status = (await del).status();
    console.log('DELETE convênio com prazo ->', status);
    await expect(page.getByText(/Não foi possível excluir/)).toHaveCount(0);
    expect(status).toBe(204);
    await expect(page.getByRole('row').filter({ hasText: newName })).toHaveCount(0);
});

test('7. regressão: criar convênio novo (sem e com prazo), filtros, listas e Dashboard', async ({ page }) => {
    await page.goto('/payers');
    await page.getByRole('button', { name: 'Novo convênio' }).click();
    await field(page, 'Nome').fill('Convênio Novo E2E');
    expect((await (async () => {
        const r = page.waitForResponse((x) => x.url().endsWith('/api/payers') && x.request().method() === 'POST');
        await page.getByRole('button', { name: 'Criar', exact: true }).click();
        return r;
    })()).status()).toBe(200);
    await expect(payerRow(page, 'Convênio Novo E2E')).toContainText('Não configurado');

    await page.getByRole('button', { name: 'Novo convênio' }).click();
    await field(page, 'Nome').fill('Convênio Com Prazo E2E');
    await field(page, 'Prazo para recurso (dias corridos)').fill('15');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(page.getByText('Informe a fonte do prazo')).toBeVisible();
    await field(page, 'Fonte do prazo').fill('Contrato E2E');
    await page.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(payerRow(page, 'Convênio Com Prazo E2E')).toContainText('15 dias corridos');

    // exclusão simples
    await payerRow(page, 'Convênio Novo E2E').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Convênio Novo E2E' })).toHaveCount(0);

    // filtros de prazo
    await page.goto('/denials');
    // Contar só depois que a tabela carregou, senão o total sai 0.
    await expect(page.locator('tbody tr').first()).toBeVisible();
    const total = await page.locator('tbody tr').count();
    const sel = page.locator('select').filter({ has: page.locator('option', { hasText: 'Sem prazo configurado' }) });
    for (const v of ['due_soon', 'overdue', 'not_configured', '']) {
        const resp = page.waitForResponse((r) => r.url().includes('/api/denials') && r.request().method() === 'GET');
        await sel.selectOption(v);
        expect((await resp).status(), v).toBe(200);
    }
    await expect(page.locator('tbody tr')).toHaveCount(total);

    await page.goto('/dashboard');
    await expect(page.getByText('Glosas abertas')).toBeVisible();
    console.log('Dashboard final: aviso visível =', await page.getByText(/sem prazo de recurso configurado/).count());
});
