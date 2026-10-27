import type { Locator, Page } from "@playwright/test";

/**
 * Campo pelo rótulo visível. O <Input> e os <select> das telas não ligam label e
 * campo por id (htmlFor sem id), então getByLabel não funciona; aqui o campo é o
 * irmão seguinte do <label>.
 */
export function field(page: Page, label: string): Locator {
    return page.locator(
        `xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[self::input or self::select or self::textarea][1]`,
    );
}
