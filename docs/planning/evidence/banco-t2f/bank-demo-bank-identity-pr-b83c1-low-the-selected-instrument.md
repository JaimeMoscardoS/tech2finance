# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bank-demo.spec.ts >> bank identity, product fees and contextual questions follow the selected instrument
- Location: tests\bank-demo.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Duración')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - complementary "MI ESPACIO" [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: t
          - generic [ref=e8]: "2"
        - generic [ref=e9]:
          - strong [ref=e10]: BancoT2F
          - generic [ref=e11]: Demo ficticia · tecnología Tech2Finance
      - navigation [ref=e13]:
        - button "Inicio" [ref=e14] [cursor=pointer]
        - button "Explorar" [ref=e18] [cursor=pointer]
        - button "Simulador" [ref=e23] [cursor=pointer]
        - button "Mi cartera" [ref=e28] [cursor=pointer]
      - generic [ref=e34]: PARA APRENDER
      - button "Tu asistente DEMO" [ref=e35] [cursor=pointer]:
        - generic [ref=e38]: Tu asistente
        - generic [ref=e39]: DEMO
      - button "Ver opciones" [ref=e40] [cursor=pointer]
      - generic [ref=e45]:
        - generic [ref=e46]: TF
        - generic [ref=e47]:
          - strong [ref=e48]: Cuenta de ejemplo
          - generic [ref=e49]: Espacio personal
    - main [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e53]:
          - text: BancoT2F /
          - strong [ref=e54]: Simulador
        - generic [ref=e55]:
          - generic [ref=e56]: ENTORNO DE DEMOSTRACIÓN
          - generic "Idioma" [ref=e57]:
            - button "Español" [pressed] [ref=e58] [cursor=pointer]: ES
            - button "English" [ref=e59] [cursor=pointer]: EN
          - button "Modo oscuro" [ref=e60] [cursor=pointer]
          - button "Hablar con IA" [ref=e63] [cursor=pointer]
          - button "Abrir asistente" [ref=e67] [cursor=pointer]
          - 'button "Nivel: Principiante" [ref=e72] [cursor=pointer]':
            - generic [ref=e73]:
              - text: "Nivel:"
              - strong [ref=e74]: Principiante
      - generic [ref=e77]:
        - generic [ref=e78]:
          - status [ref=e79]: Servidor de demo
          - button "Usar demo local" [ref=e80] [cursor=pointer]
        - button "Abrir práctica guiada" [ref=e81] [cursor=pointer]
        - generic [ref=e85]:
          - generic [ref=e86]: CONFIGURA
          - heading "Practica con dinero ficticio." [level=1] [ref=e87]
          - paragraph [ref=e88]: Prueba cantidades y observa el efecto de las aportaciones y las fluctuaciones.
        - generic [ref=e89]: "Las variaciones son inventadas: no son datos históricos ni predicen resultados futuros."
        - button "Probar histórico 2021–2025" [ref=e93] [cursor=pointer]
        - generic [ref=e96]:
          - generic [ref=e97]:
            - generic [ref=e98]: 01 / CONFIGURA
            - heading "Prepara tu ejemplo" [level=2] [ref=e99]
            - paragraph [ref=e100]: Cambia las cantidades cuando quieras.
            - generic [ref=e101]:
              - text: Tipo de activo
              - combobox "Tipo de activo" [ref=e103]:
                - option "Fondos" [selected]
                - option "ETF"
                - option "Acciones"
            - generic [ref=e104]:
              - text: Entidad
              - combobox "Entidad" [ref=e106]:
                - option "BancoT2F" [selected]
                - option "BBVA"
                - option "Santander"
                - option "CaixaBank"
            - generic [ref=e107]:
              - text: Instrumento
              - combobox "Instrumento" [ref=e109]:
                - option "T2F Equilibrio" [selected]
                - option "T2F Horizonte"
                - option "T2F Estabilidad"
              - generic [ref=e110]: T2F Equilibrio
            - generic [ref=e111]:
              - strong [ref=e112]: Condiciones ficticias del producto
              - paragraph [ref=e113]: "Mínimo inicial: 0,00 € · Aportación mínima: 0,00 €"
              - paragraph [ref=e114]: "Gastos anuales: 0,75 % · Por orden: 0,00 €"
              - paragraph [ref=e115]: "Entrada: 0,00 % · Salida: 0,00 % · Custodia anual: 0,00 %"
              - generic [ref=e116]: Condiciones y comisiones ficticias para la demostración. Las comisiones de BancoT2F son informativas y no se descuentan en los resultados del simulador.
            - generic [ref=e117]:
              - text: Importe inicial
              - generic [ref=e118]: DINERO FICTICIO
              - generic [ref=e119]:
                - spinbutton "Importe inicial DINERO FICTICIO €" [ref=e120]: "1000"
                - generic [ref=e121]: €
            - generic [ref=e122]:
              - text: Aportación mensual
              - generic [ref=e123]: OPCIONAL
              - generic [ref=e124]:
                - spinbutton "Aportación mensual OPCIONAL € / mes" [active] [ref=e125]: "0"
                - generic [ref=e126]: € / mes
            - generic [ref=e127]:
              - text: Tiempo de práctica
              - combobox "Tiempo de práctica" [ref=e129]:
                - option "6 meses"
                - option "1 año" [selected]
                - option "3 años"
                - option "5 años"
            - button "Ver mi ejemplo" [ref=e130] [cursor=pointer]
          - generic [ref=e133]:
            - generic [ref=e134]:
              - generic [ref=e135]:
                - generic [ref=e136]: 02 / DESCUBRE
                - heading "Resultado ilustrativo" [level=2] [ref=e137]
              - generic [ref=e138]: HIPOTÉTICO
            - paragraph [ref=e139]:
              - strong [ref=e140]: T2F Equilibrio
              - text: · Instrumento y variaciones ficticios
            - status [ref=e141]
            - status [ref=e142]: Has cambiado los datos. Pulsa Ver mi ejemplo para actualizar el resultado.
        - generic [ref=e143]:
          - generic [ref=e144]: © Tech2Finance · Una demo para aprender.
          - generic [ref=e145]: Sin dinero ni cuentas reales
  - generic [aria-hidden] [ref=e150]: 0 €
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('bank identity, product fees and contextual questions follow the selected instrument', async ({page}) => {
  4  |  const tutorRequests: any[] = [];
  5  |  await page.route('**/api/tutor', async route => { tutorRequests.push(route.request().postDataJSON()); await route.continue(); });
  6  |  await page.goto('/');
  7  |  await expect(page.locator('.brand')).toContainText('BancoT2F');
  8  |  await expect(page.locator('.bank-info')).toContainText('0 EUR');
  9  |  await page.getByText('Preguntas frecuentes').click();
  10 |  await page.getByText('¿Qué es BancoT2F?').click();
  11 |  await expect(page.getByText('Una entidad ficticia creada para esta demostración.')).toBeVisible();
  12 |  await page.getByRole('button',{name:'Explorar',exact:true}).click();
  13 |  const card = page.locator('.fund-card').filter({hasText:'T2F Equilibrio'});
  14 |  await expect(card).toContainText('0,75 %');
  15 |  await expect(card).toContainText('no se descuentan');
  16 |  await card.getByRole('button',{name:'Preguntar por este producto'}).click();
  17 |  const dialog = page.getByRole('dialog',{name:/asistente/i});
  18 |  await dialog.getByLabel('Tu pregunta').fill('¿Cuánto cuesta este fondo?');
  19 |  await dialog.getByRole('button',{name:'Enviar pregunta'}).click();
  20 |  await expect.poll(()=>tutorRequests.length).toBeGreaterThan(0);
  21 |  expect(tutorRequests.at(-1).context).toMatchObject({page:'explore',bankId:'demo',instrumentId:'demo-mixed'});
  22 |  expect(tutorRequests.at(-1).context.simulation).toBeUndefined();
  23 |  await expect(dialog).toContainText('0,75');
  24 |  await dialog.getByRole('button',{name:'Cerrar asistente',exact:true}).click();
  25 |  await page.getByRole('button',{name:'Simulador',exact:true}).click();
  26 |  await expect(page.locator('.bank-costs')).toContainText('0,75 %');
  27 |  await page.getByLabel('Importe inicial').fill('1000');
  28 |  await page.getByLabel('Aportación mensual').fill('0');
> 29 |  await page.getByLabel('Duración').selectOption('6');
     |                                    ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  30 |  await page.getByRole('button',{name:'Ver mi ejemplo'}).click();
  31 |  await expect(page.locator('.sim-values')).toContainText('892,64');
  32 |  await page.getByLabel('Entidad').selectOption('caixabank');
  33 |  await expect(page.locator('.bank-costs')).toContainText('Referencia externa');
  34 |  await expect(page.locator('.bank-costs')).not.toContainText('0,75 %');
  35 |  await page.getByRole('button',{name:'Mi cartera',exact:true}).click();
  36 |  await page.getByRole('button',{name:'Abrir asistente'}).click();
  37 |  await page.getByLabel('Tu pregunta').fill('¿Qué es BancoT2F?');
  38 |  await page.getByRole('button',{name:'Enviar pregunta'}).click();
  39 |  await expect.poll(()=>tutorRequests.length).toBeGreaterThan(1);
  40 |  expect(tutorRequests.at(-1).context.instrumentId).toBeUndefined();
  41 | });
  42 |
  43 | test('invalid profile triggers explicit recovery', async ({page}) => {
  44 |  await page.route('**/api/catalog', async route => { const response = await route.fetch(); const body = await response.json(); body.bankProfile.products[0].fees.entryBps = -1; await route.fulfill({response,json:body}); });
  45 |  await page.goto('/');
  46 |  await expect(page.getByRole('status')).toContainText('No se pudo cargar');
  47 |  await expect(page.locator('.app-shell')).toHaveCount(0);
  48 |  await page.getByRole('button',{name:'Usar demo local'}).click();
  49 |  await expect(page.locator('.bank-info')).toContainText('BancoT2F');
  50 | });
  51 |
  52 | test('mobile English dark view keeps the bank context readable', async ({page}) => {
  53 |  await page.setViewportSize({width:320,height:700});
  54 |  await page.goto('/');
  55 |  await page.getByRole('button',{name:'English'}).click();
  56 |  await page.getByRole('button',{name:'Dark theme'}).click();
  57 |  await expect(page.locator('.bank-info')).toContainText('Fictional institution');
  58 |  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  59 |  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  60 | });
  61 |
```