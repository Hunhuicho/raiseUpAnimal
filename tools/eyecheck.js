const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 470, height: 900 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/raiseUpAnimal/index.html');
  await p.waitForTimeout(300); await p.click('#start'); await p.waitForTimeout(400);

  const report = await p.evaluate(() => {
    // 안경·선글라스는 눈 위에 얹는 게 정상이라 검사에서 뺀다
    const SKIP = new Set(['o_glass', 'o_sun']);
    const pets = Object.keys(PET_ART);
    const heads = OUTFITS.filter(o => o.slot === 'head' && !SKIP.has(o.id));
    const rows = [];
    for (const o of heads) {
      const bad = [];
      for (const t of pets) {
        S.type = t; S.wear = { head: o.id, body: null }; render();
        const svgs = document.querySelectorAll('#pet svg');
        if (svgs.length < 2) continue;
        const eyes = [...svgs[0].querySelectorAll('ellipse')]
          .filter(e => e.getAttribute('fill') === '#3a2c44')
          .map(e => e.getBoundingClientRect());
        const parts = [...svgs[1].querySelectorAll('path,circle,ellipse,g > *')]
          .map(e => e.getBoundingClientRect());
        let worst = 0;
        for (const E of eyes) {
          const area = (E.width * E.height) || 1;
          for (const A of parts) {
            const w = Math.min(A.right, E.right) - Math.max(A.left, E.left);
            const h = Math.min(A.bottom, E.bottom) - Math.max(A.top, E.top);
            if (w > 0 && h > 0) worst = Math.max(worst, (w * h) / area);
          }
        }
        if (worst > 0.06) bad.push(`${t}(${Math.round(worst * 100)}%)`);
      }
      rows.push({ name: o.name, bad });
    }
    return rows;
  });

  let clean = true;
  for (const r of report) {
    if (r.bad.length) { clean = false; console.log(`  ${r.name}: 눈 가림 → ${r.bad.join(', ')}`); }
  }
  console.log(clean ? '머리 장식 전체 × 8종 — 눈 가림 없음' : '↑ 손볼 곳');
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
