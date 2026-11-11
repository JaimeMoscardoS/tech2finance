import { test, expect } from "@playwright/test";

test("result help is prominent and opens the local tutor with the current result", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Simulador", exact: true }).click();
  const help = page.locator(".result-help");
  const button = help.getByRole("button", { name: "Explícame este resultado" });
  await expect(button).toBeVisible();
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56);
  await expect(page.locator(".sim-result .investment-chart")).toBeVisible();
  await page.screenshot({ path: "/tmp/t2f-result-help.png", fullPage: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Tu asistente" }),
  ).toBeVisible();
  await page.locator("#chat-input").fill("¿Cuál es mi resultado?");
  await page.getByRole("button", { name: "Enviar pregunta" }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "1100,3",
  );
});

test("result help sends server tutor the active simulation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Simulador", exact: true }).click();
  const button = page.getByRole("button", { name: "Explícame este resultado" });
  await expect(button).toBeVisible();
  await button.click();
  await page.locator("#chat-input").fill("¿Cuál es mi resultado?");
  const req = page.waitForRequest(
    (r) => r.url().endsWith("/api/tutor") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "Enviar pregunta" }).click();
  const context = (await req).postDataJSON().context;
  expect(context.page).toBe("simulator");
  expect(context.instrumentId).toBe("caixabank-monetario-estandar");
  expect(context.simulation.instrumentId).toBe("caixabank-monetario-estandar");
});

test("result help fits and remains legible in each level and theme on mobile", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 800 },
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("button", { name: "Simulador", exact: true }).click();
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Modo oscuro" }).click();
    for (const level of ["Básico", "Intermedio", "Avanzado"]) {
      await page.locator(".level-button").click();
      await page
        .locator(".level-menu")
        .getByRole("button", { name: level, exact: true })
        .click();
      const button = page.getByRole("button", {
        name: "Explícame este resultado",
      });
      await expect(button).toBeVisible();
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
  await context.close();
});
