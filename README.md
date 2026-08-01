# 오늘도 무럭무럭

반려동물이 기뻐할수록 코인이 쌓이고, 그 코인으로 용품을 사서 더 기쁘게 만드는 육성 게임.

기획 문서는 [`docs/기획서.md`](docs/기획서.md)에 있습니다.

## 어떻게 만들어져 있나

**파일 하나짜리 게임입니다.** `index.html` 안에 HTML·CSS·JavaScript가 전부 들어 있고,
바깥에서 받아오는 것이 하나도 없습니다.

| 보통 이렇게 하는 것 | 여기서는 |
|---|---|
| 이미지 파일 | SVG를 코드로 직접 그림 (캐릭터·옷·소품) |
| 음원 파일 | Web Audio로 그 자리에서 연주 |
| 폰트 CDN | 기기에 있는 글꼴 |
| 프레임워크 | 없음 |
| 서버·API | 없음 — 저장은 브라우저 `localStorage` |

그래서 빌드 도구도, 서버도, 데이터베이스도 필요 없습니다.
`index.html`을 브라우저로 그냥 열어도 완전한 게임이 돌아갑니다.

## 로컬에서 보기

```bash
open index.html          # 이걸로 충분합니다
```

배포된 것과 똑같은 상태(서비스 워커·매니페스트 포함)로 보려면:

```bash
npm run dev              # http://localhost:4173
```

> 서비스 워커는 `http://`에서만 동작하므로 `file://`로 열면 등록되지 않습니다.
> 게임 자체는 어느 쪽이든 똑같이 돌아갑니다.

## Cloudflare Pages에 올리기

빌드는 `index.html`과 아이콘들을 `public/`에 모으는 것이 전부입니다(`build.mjs`).
의존성이 하나도 없어서 `npm install`도 필요 없습니다.

### 방법 1 — GitHub 연결 (한 번만 설정하면 이후 자동)

Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**

| 항목 | 값 |
|---|---|
| Repository | `Hunhuicho/raiseUpAnimal` |
| Production branch | 배포할 브랜치 |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `public` |

저장하면 그 브랜치에 푸시할 때마다 자동으로 배포됩니다.

### 방법 2 — 명령 한 줄

```bash
npx wrangler login
npm run deploy
```

`wrangler.toml`에 프로젝트 이름(`raise-up-animal`)과 출력 폴더가 적혀 있습니다.

### 방법 3 — GitHub Actions

`.github/workflows/deploy.yml`이 들어 있습니다. 저장소 **Settings → Secrets → Actions**에
아래 둘을 넣으면 푸시할 때마다 배포됩니다.

| 시크릿 | 어디서 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → *Edit Cloudflare Workers* 템플릿 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 대시보드 우측 사이드바 |

## 올라가는 것

```
public/
  index.html            게임 전부
  sw.js                 오프라인에서도 놀 수 있게
  manifest.webmanifest  홈 화면에 추가하면 앱처럼
  icon.svg / icon-180 / icon-192 / icon-512
  _headers              index.html은 캐시 안 함, 아이콘은 일주일
  _redirects            어떤 주소로 와도 게임 한 판
```

`docs/`와 `tools/`는 개발용이라 배포되지 않습니다.

**휴대폰 홈 화면에 추가하면** 주소창 없이 전체 화면으로 뜨고, 한 번 받아둔 뒤에는
인터넷이 없어도 그대로 돌아갑니다. 게임에 필요한 것이 전부 그 파일 하나에 있기 때문입니다.

## 저장은 어디에 되나

브라우저 `localStorage`입니다. 서버가 없습니다.

| 키 | 내용 |
|---|---|
| `raiseUpAnimal.v1` | 지금 판 (반려동물·코인·물건·방·성장치…) |
| `raiseUpAnimal.prev` | 저장 직전 백업 — ⏪ 저장 취소용 |
| `raiseUpAnimal.album` | 발도장과 앨범 — 새로 시작해도 남음 |
| `raiseUpAnimal.sound` | 소리 켜짐/꺼짐 |

이 방식의 한계는 분명합니다. **기기마다 따로 저장되고, 브라우저 기록을 지우면 사라집니다.**
기기를 넘나드는 저장이 필요해지면 그때 Supabase나 Cloudflare D1을 붙이면 됩니다 —
지금 구조에서는 `save()` / `load()` 두 함수만 갈아 끼우면 되도록 되어 있습니다.

## 개발 도구

```bash
NODE_PATH=<playwright 설치 경로> node tools/eyecheck.js
```

머리 장식이 동물의 눈을 가리는지 픽셀 단위로 검사합니다. 옷을 새로 그린 뒤에 돌려보세요.
자세한 내용은 [`tools/README.md`](tools/README.md).
