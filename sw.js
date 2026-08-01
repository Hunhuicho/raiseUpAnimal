/* 서비스 워커 — 지하철에서도 게임이 돌아가게 한다.

   게임 자체는 파일 하나에 다 들어 있고 저장은 localStorage라, 한 번만 받아두면
   인터넷 없이도 완전히 굴러간다. 그 "한 번"을 여기서 챙긴다.

   정책은 둘뿐이다.
   - 문서(index.html)는 네트워크 먼저. 고친 게 바로 반영되어야 하므로.
     실패하면 그때 캐시를 꺼낸다. (캐시 먼저로 두면 새 버전이 안 보인다)
   - 아이콘·매니페스트는 캐시 먼저. 바뀔 일이 거의 없고 용량이 크다.

   VERSION을 올리면 옛 캐시는 activate에서 전부 지워진다. */

const VERSION = "v1";
const CACHE = `mureok-${VERSION}`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  // 하나가 실패해도 나머지는 받아둔다 — 아이콘 하나 때문에 설치가 통째로 깨지면 손해다
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 남의 집 요청은 건드리지 않는다

  // 문서 — 네트워크 먼저, 안 되면 캐시
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // 나머지 — 캐시 먼저, 없으면 받아서 캐시에 넣어둔다
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
