import { test, expect } from "@playwright/test";

test("beginner search and advanced chart selection retain selected fund", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar", exact: true }).click();
  await expect(page.getByLabel("Entidad de la demo")).toHaveCount(0);
  await page.getByLabel("Buscar por nombre").fill("Horizonte");
  await expect(page.locator(".beginner-guide")).toContainText(
    "Coincidencias: 1",
  );
  await page
    .locator(".beginner-guide select")
    .last()
    .selectOption("demo-equity");
  await expect(page.locator(".beginner-card h2")).toHaveText("Fondo Horizonte");
  await expect(page.locator(".filter-disclosure")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator(".filter-disclosure summary").click();
  await expect(page.getByLabel("Ordenar por")).toBeVisible();
  await page.getByLabel("Buscar por nombre").fill("");
  await page
    .getByRole("group", { name: "Nivel de detalle" })
    .getByRole("button", { name: "Avanzado" })
    .click();
  const picker = page.getByRole("group", { name: /Elige hasta tres series/ });
  await expect(picker.locator("input:checked")).toHaveCount(3);
  await picker.locator("input").first().uncheck();
  await expect(page.locator(".dashboard-card")).toHaveCount(2);
  await expect(page.locator(".technical-inspector h2")).toHaveText(
    "Fondo Horizonte",
  );
  await page.screenshot({
    path: "/tmp/t2f-latest-advanced.png",
    fullPage: true,
  });
});

test("goal templates depend on answers, preserve cents and reset manual edits", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar", exact: true }).click();
  await page.locator(".goals-panel summary").click();
  const p = page.locator(".goals-panel");
  await p.getByLabel("¿Para qué ahorras?").selectOption("project");
  await p.getByLabel("¿Cuándo podrías necesitarlo?").selectOption("short");
  await expect(p).toContainText("al menos cinco años");
  await expect(p.locator(".goals-example")).toHaveCount(0);
  await p.getByLabel("¿Cuándo podrías necesitarlo?").selectOption("long");
  await p
    .getByLabel("¿Podrías necesitar este dinero pronto?")
    .selectOption("no");
  await p
    .getByLabel("¿Tienes una reserva para imprevistos?")
    .selectOption("yes");
  await p.getByLabel("¿Tienes deudas costosas pendientes?").selectOption("no");
  await p
    .getByLabel("¿Qué fluctuaciones estarías dispuesto a explorar?")
    .selectOption("medium");
  await expect(p.getByLabel("Efectivo (%)")).toHaveValue("40");
  await expect(p.getByLabel("Bonos (%)")).toHaveValue("40");
  await expect(p.getByLabel("Acciones (%)")).toHaveValue("20");
  await p.getByLabel("Importe de ejemplo opcional (€)").fill("0.05");
  await expect(p).toContainText("Efectivo 0,02");
  await expect(p).toContainText("Acciones 0,01");
  await p.getByLabel("Acciones (%)").fill("25");
  await expect(p).toContainText("sumar 100");
  await expect(p).toContainText("Ajuste manual");
  await p
    .getByLabel("¿Qué fluctuaciones estarías dispuesto a explorar?")
    .selectOption("low");
  await expect(p.getByLabel("Efectivo (%)")).toHaveValue("60");
  await expect(p.getByLabel("Acciones (%)")).toHaveValue("0");
  for (const level of ["Intermedio", "Avanzado"]) {
    await page
      .getByRole("group", { name: "Nivel de detalle" })
      .getByRole("button", { name: level })
      .click();
    await expect(p).toContainText("escenario ilustrativo editable");
  }
  await page.screenshot({ path: "/tmp/t2f-latest-goals.png", fullPage: true });
});

test("configured Caixa bank scopes exploration, simulator and practice", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("http://127.0.0.1:5177/");
  await page.getByRole("button", { name: "Explorar", exact: true }).click();
  await expect(page.locator(".institution-label")).toContainText("CaixaBank");
  await expect(page.getByLabel("Entidad de la demo")).toHaveCount(0);
  await expect(page.locator(".beginner-card h2")).toContainText("CAIXABANK");
  await expect(
    page.locator(".beginner-guide select").last().locator("option"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Simulador", exact: true }).click();
  await expect(page.getByLabel("Entidad", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Instrumento").locator("option")).toHaveCount(1);
  await page.getByRole("button", { name: "Abrir práctica guiada" }).click();
  await expect(page.locator(".practice-lab")).toBeVisible();
  await expect(page.locator(".practice-lesson:disabled")).toHaveCount(2);
  await page.screenshot({ path: "/tmp/t2f-config-caixa.png", fullPage: true });
  await context.close();
});

test("invalid configured bank has a clear error and no fallback", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("t2f-data-mode", "local"),
  );
  await page.goto("http://127.0.0.1:5178/");
  await expect(
    page.getByRole("heading", { name: "Catálogo no disponible" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
  await context.close();
});
