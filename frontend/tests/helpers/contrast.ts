import type { Page } from '@playwright/test';

/** Recorre el texto visible y mide el contraste WCAG (4,5:1; 3:1 en texto grande). */
export async function lowContrast(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    // El canvas normaliza cualquier sintaxis de color (rgb, color(srgb ...), color-mix) a RGBA.
    const parse = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; };
    type RGBA = { r: number; g: number; b: number; a: number };
    const over = (top: RGBA, bottom: RGBA): RGBA => { const a = top.a + bottom.a * (1 - top.a); return a === 0 ? top : { r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a, g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a, b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a, a }; };
    const lum = (c: RGBA) => [c.r, c.g, c.b].map((v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    const background = (el: Element): RGBA => {
      const chain: RGBA[] = [];
      for (let e: Element | null = el; e; e = e.parentElement) { const bg = parse(getComputedStyle(e).backgroundColor); if (bg.a > 0) chain.push(bg); if (bg.a === 1) break; }
      return chain.reduceRight((acc, c) => over(c, acc), { r: 255, g: 255, b: 255, a: 1 });
    };
    const out: { text: string; ratio: number; size: number }[] = [];
    let checked = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim(); const el = n.parentElement;
      if (!text || !el || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
      const box = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (box.width < 3 || box.height < 3 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('details:not([open]) > :not(summary)')) continue;
      // Los controles deshabilitados están exentos de contraste mínimo (WCAG 1.4.3).
      if (el.closest('button:disabled, input:disabled, select:disabled')) continue;
      const isSvg = el instanceof SVGElement;
      let fg = parse(isSvg ? cs.fill : cs.color);
      let opacity = 1; for (let e: Element | null = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
      fg = { ...fg, a: fg.a * opacity };
      const bg = background(el);
      const f = over(fg, bg);
      const l1 = lum(f), l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      checked++;
      if (ratio < need) out.push({ text: text.slice(0, 40), ratio: +ratio.toFixed(2), size });
    }
    return { failures: out, checked };
  });
}
