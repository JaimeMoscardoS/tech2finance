import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("t2f-data-mode", "local"));
});

test("selects every level and supports keyboard, back and outside dismissal", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator(".level-button");
  const menu = page.locator(".level-menu");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("button", { name: "Volver" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu).toHaveAttribute("inert", "");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("button", { name: "Volver" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  for (const [name, value] of [["Intermedio", "intermediate"], ["Avanzado", "advanced"], ["Principiante", "beginner"]]) {
    await trigger.click();
    await expect(menu.getByRole("button", { name })).toBeVisible();
    await menu.getByRole("button", { name }).click();
    await expect(page.locator("html")).toHaveAttribute("data-level", value);
    await expect(trigger).toContainText(name);
  }
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("button", { name: "Volver" })).toBeFocused();
  await expect(menu.getByRole("button", { name: "Principiante" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(menu).toHaveAttribute("inert", "");
  await trigger.click();
  await menu.getByRole("button", { name: "Volver" }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-level", "beginner");
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(menu).toHaveCSS("filter", "blur(0px)");
  await page.screenshot({ path: "test-results/level-desktop-open.png" });
  await page.locator("h1").first().click();
  await expect(menu).toHaveAttribute("inert", "");
});

test("animates the expansion and survives rapid reopening", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator(".level-button");
  const menu = page.locator(".level-menu");
  await trigger.click();
  const animated = await menu.evaluate(element => getComputedStyle(element).transform);
  expect(animated).not.toBe("none");
  await page.keyboard.press("Escape");
  await trigger.click({ force: true });
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveAttribute("inert", "");
  await expect(menu.getByRole("button", { name: "Volver" })).toBeFocused();
});

for (const language of ["es", "en"]) for (const theme of ["light", "dark"]) {
  test(`320px ${language} ${theme} stays usable with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(({ language, theme }) => { localStorage.setItem("t2f-language", language); localStorage.setItem("t2f-theme", theme); }, { language, theme });
    await page.goto("/");
    await page.locator(".level-button").click();
    const menu = page.locator(".level-menu");
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= 320).toBeTruthy();
    const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, elements: [...document.querySelectorAll("*")].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(e => `${e.tagName}.${e.className}`) }));
    expect(overflow, JSON.stringify(overflow)).toMatchObject({ width: 320 });
    for (const button of await menu.locator("button").all()) {
      const size = await button.boundingBox();
      expect(size && size.height >= 44 && size.width >= 44).toBeTruthy();
    }
    await expect(menu).toHaveCSS("filter", "none");
    await page.screenshot({ path: `test-results/level-${language}-${theme}-320.png` });
  });
}
