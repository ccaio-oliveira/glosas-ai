import { closeSync, openSync } from "node:fs";
import { E2E_DB, artisan, assertIsolatedEnvironment, prepareStorage } from "./support/env";

// Banco e cache zerados a cada execução. A guarda vem antes de qualquer escrita, e o
// migrate:fresh só roda se ela passar.
export default function globalSetup() {
    prepareStorage();
    assertIsolatedEnvironment();

    // Só cria o arquivo do sqlite depois da guarda (o Laravel não cria sozinho).
    closeSync(openSync(E2E_DB, 'a'));

    artisan(['migrate:fresh', '--database=sqlite', '--seed', '--seeder=Database\\Seeders\\E2eSeeder', '--force']);
    // O throttle do /login vive no cache (arquivo); sem limpar, execuções seguidas
    // herdariam tentativas da anterior.
    artisan(['cache:clear']);
}
