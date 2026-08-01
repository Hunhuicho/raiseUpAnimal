/* 배포용 폴더(public/)를 만든다.

   빌드랄 게 없다 — 게임은 파일 하나에 다 들어 있고 바깥에서 받아오는 것도 없다.
   그래서 이 스크립트가 하는 일은 "내보낼 파일만 골라 담기"가 전부다.
   의존성이 하나도 없으므로 Cloudflare 빌드에서 npm install이 필요 없다.

   실행: node build.mjs   (또는 npm run build) */

import { mkdir, rm, copyFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = "public";

// 내보낼 파일 목록. 여기 없는 건 배포되지 않는다 — docs/, tools/ 는 개발용이므로 뺀다.
const FILES = [
  "index.html",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "_headers",     // Cloudflare Pages 캐시·보안 헤더
  "_redirects",   // 어떤 주소로 와도 게임 한 판
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

let total = 0;
for (const f of FILES) {
  await copyFile(f, join(OUT, f));
  total += (await stat(join(OUT, f))).size;
}

const names = (await readdir(OUT)).sort();
console.log(`${OUT}/ — ${names.length}개 파일, ${(total / 1024).toFixed(0)}KB`);
for (const n of names) console.log("  " + n);
