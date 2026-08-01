// 머리 장식이 눈을 실제로 가리는지 픽셀 단위로 검사한다.
// 바운딩 박스로 재면 곡선(머리띠 등)에서 오탐이 난다 — 장식 레이어만 래스터화해서
// 눈 영역의 불투명 픽셀을 직접 센다.
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SKIP = ['o_glass', 'o_sun'];   // 안경류는 눈 위에 얹는 게 정상
const LIMIT = 0.06;                  // 눈 넓이의 6%까지는 눈감아 준다

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ reducedMotion: 'reduce' });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE);
  await p.waitForTimeout(300);
  await p.click('.picks button[data-k="cat"]');   // 아무것도 미리 골라져 있지 않다
  await p.click('#start');
  await p.waitForTimeout(400);

  const rows = await p.evaluate(async ([skip, limit]) => {
    const N = 240;                                   // 120 viewBox를 2배로 래스터화
    const raster = (svg) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = cv.height = N;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, N, N);
        res(ctx.getImageData(0, 0, N, N).data);
      };
      img.onerror = rej;
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svg.replace('<svg', `<svg width="${N}" height="${N}"`));
    });

    const out = [];
    for (const o of OUTFITS.filter(x => x.slot === 'head' && !skip.includes(x.id))) {
      const bad = [];
      for (const t of Object.keys(PET_ART)) {
        S.type = t; S.wear = { head: null, body: null }; render();
        // 눈 위치는 캐릭터 SVG에서 직접 읽는다
        const eyes = [...document.querySelector('#pets .pet').querySelectorAll('svg')[0].querySelectorAll('ellipse')]
          .filter(e => e.getAttribute('fill') === '#3a2c44')
          .map(e => { const b = e.getBBox(); return { x: b.x * 2, y: b.y * 2, w: b.width * 2, h: b.height * 2 }; });
        if (!eyes.length) continue;

        // 게임과 똑같은 배치식을 쓴다 — 배율이 붙는 종(어항 속 금붕어)이 있으므로
        const px = await raster(art(`<g transform="${fitAt(ACC_FIT, t)}">${ACC_ART[o.id]}</g>`));

        let worst = 0;
        for (const e of eyes) {
          let hit = 0, total = 0;
          for (let y = Math.floor(e.y); y < e.y + e.h; y++)
            for (let x = Math.floor(e.x); x < e.x + e.w; x++) {
              if (x < 0 || y < 0 || x >= N || y >= N) continue;
              // 타원 안쪽만
              const nx = (x - (e.x + e.w / 2)) / (e.w / 2), ny = (y - (e.y + e.h / 2)) / (e.h / 2);
              if (nx * nx + ny * ny > 1) continue;
              total++;
              if (px[(y * N + x) * 4 + 3] > 24) hit++;
            }
          if (total) worst = Math.max(worst, hit / total);
        }
        if (worst > limit) bad.push(`${t} ${Math.round(worst * 100)}%`);
      }
      out.push({ name: o.name, bad });
    }
    return out;
  }, [SKIP, LIMIT]);

  let clean = true;
  for (const r of rows) if (r.bad.length) { clean = false; console.log(`  ${r.name}: 눈 가림 → ${r.bad.join(', ')}`); }
  console.log(clean
    ? `머리 장식 ${rows.length}종 × 동물 8종 — 눈 가림 없음`
    : '↑ 손볼 곳');
  if (errs.length) console.log('errors:', errs);
  await b.close();
  process.exit(clean ? 0 : 1);
})();
