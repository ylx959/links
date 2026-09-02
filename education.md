# education.md — 這個網站，從零開始的完整說明

這份文件是寫給「第一次做網站的人」看的。它不假設你知道什麼是 npm、什麼是元件、
什麼是 import。目標是：讀完之後，你打開這個專案的任何一個檔案，都知道
**它是誰、它給誰用、它為什麼長這樣**。

> 想直接改內容不想讀原理 → 跳到 §12「常見修改食譜」。

---

## 目錄

1. [這個網站是什麼](#1-這個網站是什麼)
2. [技術棧：每一個東西為什麼在這裡](#2-技術棧每一個東西為什麼在這裡)
3. [一個網頁是怎麼跑起來的](#3-一個網頁是怎麼跑起來的)
4. [import / export 完全解釋](#4-import--export-完全解釋)
5. [這個專案的依賴圖](#5-這個專案的依賴圖)
6. [設定層：專案外圍的檔案](#6-設定層專案外圍的檔案)
7. [資料層 `src/data/`](#7-資料層-srcdata)
8. [圖示層 `src/icons/`](#8-圖示層-srcicons)
9. [元件層 `src/components/`](#9-元件層-srccomponents)
10. [動畫層 `src/animation/`](#10-動畫層-srcanimation)
11. [樣式層 `src/index.css`](#11-樣式層-srcindexcss)
12. [常見修改食譜](#12-常見修改食譜)
13. [三個比較難的細節](#13-三個比較難的細節)
14. [名詞表](#14-名詞表)

---

## 1. 這個網站是什麼

一個 **link hub**（中繼站 / linktree）。整個網站只有**一頁**，沒有路由、沒有後端、
沒有資料庫。它的工作是：把你的頭貼、一句自介、幾個對外連結、一句引言，
排在一個乾淨的版面上。

用途：Instagram bio 只能放一個連結時，放這個網址，其他全部從這裡分流出去。

**技術上它是一個「靜態網站」**：建置完之後就是一堆 `.html` / `.js` / `.css` / 圖片，
丟到任何免費空間（Vercel、Netlify、GitHub Pages）都能跑。沒有伺服器在算東西。

---

## 2. 技術棧：每一個東西為什麼在這裡

打開 `package.json` 你會看到兩組東西。先講**它們的分工**：

```
dependencies      → 網站跑起來時真的會用到的東西（會被打包進 dist/）
devDependencies   → 只有你在開發／建置時用到的工具（不會進 dist/）
```

### dependencies（上線也要）

| 套件 | 它是什麼 | 這個專案用它做什麼 |
|---|---|---|
| `react` | UI 函式庫。讓你用「函式」描述畫面 | 每一個 `src/components/*.tsx` 都是一個 React 元件 |
| `react-dom` | 把 React 描述出來的畫面，真的畫到瀏覽器 DOM 上 | `main.tsx` 的 `createRoot(...).render(...)` |
| `tailwindcss` | CSS 框架。把樣式寫成一堆小 class | 全站的樣式幾乎都在 `className="..."` 裡 |
| `@tailwindcss/vite` | Tailwind 的 Vite 外掛 | 讓 Vite 在打包時掃描你的 class 並產生 CSS |
| `gsap` | 動畫引擎 | 進場動畫、頭貼 hover 的波動框 |
| `@gsap/react` | GSAP 官方的 React 綁定 | 提供 `useGSAP()`，元件消失時自動清掉動畫 |

### devDependencies（只有開發用）

| 套件 | 它是什麼 |
|---|---|
| `vite` | 開發伺服器 + 打包器。`npm run dev` 跑的就是它 |
| `@vitejs/plugin-react` | 讓 Vite 看得懂 `.tsx`（JSX 語法） |
| `typescript` | 型別檢查器。把 `.ts/.tsx` 檢查完再交給 Vite |
| `@types/react`、`@types/react-dom`、`@types/node` | 幫這些函式庫補上型別說明書 |
| `oxlint` | 程式碼檢查（lint），抓沒用到的變數之類 |

### 四個指令

```bash
npm install     # 讀 package.json，把上面所有套件抓進 node_modules/
npm run dev     # 開發模式，改檔案瀏覽器立刻更新（HMR）
npm run build   # tsc -b 型別檢查 → vite build 產生 dist/
npm run preview # 用靜態伺服器打開 dist/，模擬上線後的樣子
```

**`npm run build` 有兩段是刻意的**：`tsc -b` 先做型別檢查。
所以「icon 名字打錯」這種事會在**建置時**就爆掉，而不是上線後畫面破一個洞。
這是這個專案整個資料架構設計的核心目的（見 §7）。

---

## 3. 一個網頁是怎麼跑起來的

順著箭頭讀，這就是**執行順序**：

```
瀏覽器打開網址
   │
   ▼
index.html                       ← 唯一的 HTML。字型 <link>、<div id="root">
   │  <script type="module" src="/src/main.tsx">
   ▼
src/main.tsx                     ← 程式的入口（entry point）
   │  1. import './index.css'    → 所有樣式進來
   │  2. 用 site.meta 改 document.title / description
   │  3. createRoot(#root).render(<App />)
   ▼
src/App.tsx                      ← 版面總指揮：決定誰排在誰上面
   │
   ├─▶ ProfileHeader  ──▶ Avatar  ──▶ avatarRing.ts（hover 動畫）
   ├─▶ LinkList       ──▶ LinkButton ──▶ icons/registry
   ├─▶ QuoteBlock
   └─▶ IconLinkRow    ──▶ icons/registry
   │
   └─▶ playEntrance()（進場動畫）
```

`index.html` 裡的 `<div id="root"></div>` 是空的。**整個網站的 HTML 都是 JavaScript
在瀏覽器裡生出來的**，這就是所謂的 SPA（single-page application）。

---

## 4. import / export 完全解釋

這是你問的重點，所以講細一點。

### 4.1 一個檔案 = 一個模組

在現代 JavaScript 裡，**每個檔案都是封閉的**。你在 `a.ts` 寫的變數，
`b.ts` 預設看不到。要讓別人看到，必須明講：

```ts
// a.ts
export const name = 'Yang'        // 「這個我公開」
const secret = 123                 // 沒 export → 只有 a.ts 自己看得到
```

```ts
// b.ts
import { name } from './a'         // 「我要 a.ts 公開的那個 name」
```

### 4.2 兩種 export

**具名匯出（named export）** — 這個專案幾乎全部都用這種：

```ts
export const profile = { ... }         // 匯出
export function LinkButton() { ... }
export interface LinkItem { ... }
```

```ts
import { profile } from './data/profile'      // 匯入時名字要一模一樣，要加大括號
import { profile, groups } from './data'      // 可以一次拿好幾個
```

**預設匯出（default export）** — 一個檔案最多一個：

```ts
// App.tsx
export default function App() { ... }
```

```ts
import App from './App'      // 沒有大括號，名字你自己取（但慣例上取一樣的）
```

> 這個專案只有兩個 default export：`App.tsx` 的 `App`，以及 `vite.config.ts` 的設定物件。
> 其他一律具名。**理由**：具名匯出打錯字時編輯器會直接報錯，default 不會。

### 4.3 `import type` 是什麼

你會看到兩種寫法：

```ts
import { icons } from '../icons/registry'          // 一般 import
import type { LinkItem } from '../data'            // type import
```

差別：`interface`、`type` 這些**只存在於 TypeScript**，編譯成 JavaScript 之後就消失了。
加上 `type` 關鍵字是在跟編譯器說「這個只是型別，打包時整行刪掉」。
好處是不會為了一個型別而把整個檔案拉進 bundle。

也可以混寫：

```ts
import { isExternal, type LinkItem } from '../data'
//       ^ 真的值        ^ 只是型別
```

### 4.4 路徑怎麼看

```ts
import { useState } from 'react'          // 沒有 ./ → 去 node_modules 找套件
import { icons } from '../icons/registry' // ../ → 上一層資料夾
import { profile } from './profile'       // ./  → 同一層資料夾
import './index.css'                      // 沒有 { } → 只是「執行這個檔案」，不拿東西
```

`from './data'` 沒有寫檔名 → 會自動找 `./data/index.ts`。

### 4.5 barrel（桶）檔案：`src/data/index.ts`

```ts
export type { Avatar, LinkGroup, LinkItem, Profile, Quote, SiteConfig, SiteMeta } from './types'
export { profile } from './profile'
export { groups, footerLinks } from './links'
export { site } from './site'
export { visibleGroups, isExternal } from './selectors'
```

這個檔案**自己什麼都沒定義**，它只是把資料夾裡的東西收集起來、統一從一個門口出去。
這叫 barrel。

有了它，元件可以寫：

```ts
import { isExternal, type LinkItem } from '../data'
```

而不是：

```ts
import { isExternal } from '../data/selectors'
import type { LinkItem } from '../data/types'
```

**真正的好處不是少打字，是「換位置不用改元件」**：哪天你把 `selectors.ts` 拆成兩個檔，
只要 `index.ts` 的門面不變，所有元件一行都不用動。

---

## 5. 這個專案的依賴圖

箭頭 `A ──▶ B` 讀作「**A import 了 B**」。注意箭頭**永遠往下**，沒有任何一條往回。

```
                          main.tsx
                             │
                ┌────────────┼──────────────┐
                ▼            ▼              ▼
            index.css      App.tsx    data/index.ts (site)
                             │
        ┌────────────┬───────┴──────┬──────────────┐
        ▼            ▼              ▼              ▼
  ProfileHeader   LinkList      QuoteBlock    IconLinkRow
        │            │                             │
        ▼            ▼                             │
     Avatar     LinkButton ◀───────────────────────┘
        │            │        （兩者都用 icons/registry）
        ▼            ▼
 animation/     icons/registry.tsx
 avatarRing.ts        ▲
                      │
                 data/types.ts   ← 型別從這裡拿 IconName
                      ▲
        ┌─────────────┼─────────────┐
        │             │             │
   profile.ts     links.ts    selectors.ts
        └──────┬──────┘
               ▼
            site.ts
               ▼
         data/index.ts
```

### 分層規則（這是整個架構的骨架）

```
第 0 層  icons/registry.tsx    最底層，誰都不 import（除了 react 的型別）
第 1 層  data/types.ts         只 import 第 0 層，拿 IconName
第 2 層  data/profile|links    只 import types
第 3 層  data/site|selectors   組合第 2 層
第 4 層  data/index.ts         門面
第 5 層  components/*          消費資料 + 圖示，不定義資料
第 6 層  App.tsx               只負責排版順序
第 7 層  main.tsx              掛載
```

**沒有循環依賴**（A import B、B 又 import A）。這不是巧合，是設計出來的：
資料不知道元件的存在，元件不知道版面的存在。
所以「改資料」永遠不會弄壞元件，「改元件樣式」永遠不會弄壞資料。

---

## 6. 設定層：專案外圍的檔案

| 檔案 | 做什麼 |
|---|---|
| `index.html` | 唯一 HTML。載 Google Fonts（Inter + Newsreader）、favicon、`<div id="root">` |
| `vite.config.ts` | 告訴 Vite 掛兩個外掛：`react()` 讓它懂 JSX，`tailwindcss()` 讓它產生 CSS |
| `tsconfig.json` | 拆成 `.app`（給 `src/`）和 `.node`（給 `vite.config.ts`），因為兩邊執行環境不同 |
| `.oxlintrc.json` | lint 規則 |
| `.gitignore` | 叫 git 不要記錄 `node_modules/`、`dist/` 這些可以重新產生的東西 |
| `public/` | **原封不動被複製到 `dist/`**。`avatar.webp`、`favicon.svg` 在這裡。程式裡用 `/avatar.webp` 引用（開頭的 `/` 代表網站根目錄） |
| `src/assets/` | 跟 `public/` 不同：這裡的東西要被 import 才會進打包，會加上 hash 檔名。`portfolio-mark.svg` 是原稿留底 |
| `dist/` | `npm run build` 的產物。**不要手改**，也不要進 git |
| `avatar-source.heic` | 頭貼原始檔。刻意放在專案根目錄而不是 `public/`，否則 2.4MB 的原檔會被上傳到網站上 |

### `vite.config.ts` 全文

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`defineConfig` 只是一個「幫你補型別提示」的包裝函式，把物件原封不動回傳。

---

## 7. 資料層 `src/data/`

**這是整個專案最重要的資料夾**，也是當初「先建立資料架構，再做內容」的那個架構。
核心想法：**畫面是資料的函式**。要改網站內容，只碰這個資料夾。

### 7.1 `types.ts` — 契約

它不產生任何畫面，只描述「一筆資料長什麼樣」。

```ts
export interface LinkItem {
  id: string            // 必填
  label: string
  href: string
  icon: IconName        // ← 不是 string！見下方
  description?: string  // ? = 可選，可以不寫
  external?: boolean
  hidden?: boolean
}
```

**`interface` 是什麼**：一張「形狀說明書」。你宣告一個變數是 `LinkItem`，
TypeScript 就會在你少寫 `href`、或把 `id` 寫成數字時，直接在編輯器裡畫紅線。

**`icon: IconName` 是這個檔案最關鍵的一行**：

```ts
import type { IconName } from '../icons/registry'
```

`IconName` 不是 `string`，而是「registry 裡所有 key 組成的聯集」，也就是：

```ts
'github' | 'linkedin' | 'x' | 'instagram' | 'youtube' | 'threads'
| 'discord' | 'portfolio' | 'mail' | 'resume' | 'link'
```

所以在 `links.ts` 寫 `icon: 'githup'`（打錯字）→ **`npm run build` 直接失敗**，
而不是上線後那顆按鈕變成空白。這叫「把錯誤往前推到編譯期」。

其他型別：

- `LinkGroup` — 一組連結。就算只有一組、沒有標題，也包成群組。這樣哪天你想
  分成「Work / Personal」兩區，結構不用改。
- `Avatar` — 頭貼的 `src` / `zoom` / `offsetX` / `offsetY` / `alt` / `initials`
- `Quote`、`Profile`、`SiteMeta`
- `SiteConfig` — 把上面全部包成一個網站設定

### 7.2 `profile.ts` — 你是誰

```ts
export const profile: Profile = {
  name: 'Yang Lin-Hsuan',
  headline: 'CS student · create through both design and code',
  avatar: { src: '/avatar.webp', zoom: 1.2, offsetX: 10, offsetY: 16, alt: '...', initials: 'YN' },
  quote: { text: '...' },
}
```

`const profile: Profile = {...}` 這個寫法叫**型別註記**。冒號後面那個 `Profile`
是在說「這個物件必須符合 Profile 的形狀」。少一個必填欄位就報錯。

### 7.3 `links.ts` — 連去哪裡

匯出兩個東西：

- `groups` — 中間那三顆大按鈕
- `footerLinks` — copyright 上面那排小圖示

兩者用的是**同一個 `LinkItem` 型別**，只是被不同元件用不同方式畫出來
（`LinkButton` vs `IconLinkRow`）。這是資料與呈現分離的具體例子。

### 7.4 `selectors.ts` — 資料的過濾器

```ts
export function visibleGroups(groups: LinkGroup[]): LinkGroup[]
export function isExternal(item: LinkItem): boolean
```

**為什麼要有這一層？** 因為「哪些該顯示」是**規則**，不是資料也不是樣式。
把它放在中間，`App.tsx` 只要寫 `visibleGroups(site.groups)`，不用自己過濾。

`visibleGroups` 做兩件事：先丟掉 `hidden: true` 的項目，再丟掉因此變空的群組
（不然會留下一個有標題卻沒東西的區塊）。

`isExternal` 決定要不要 `target="_blank"`：
有寫 `external` 就聽你的；沒寫就看網址是不是 `http(s)://` 開頭
（所以 `mailto:` 不會另開分頁 — 那才是對的行為）。

> `LinkGroup[]` 的 `[]` 讀作「陣列」。`LinkGroup[]` = 一串 LinkGroup。

### 7.5 `site.ts` — 組裝

```ts
export const site: SiteConfig = {
  meta: {
    title: `${profile.name} — Links`,        // 從 profile 算出來，不重複寫
    description: profile.headline,
    url: 'https://example.com',
  },
  profile, groups, footerLinks,
  footer: `© ${new Date().getFullYear()} ${profile.name}`,   // 年份自動更新
}
```

`` `${...}` `` 是樣板字串（template literal），用反引號包起來，
裡面的 `${}` 會被求值後插進去。所以你改名字，標題和 copyright 會一起改。

### 7.6 `index.ts` — 門面

見 §4.5。

---

## 8. 圖示層 `src/icons/`

`registry.tsx`（注意副檔名是 `.tsx` 不是 `.ts`，因為裡面有 JSX）。

### 為什麼不用 icon 套件

一般人會裝 `lucide-react` 之類的。這裡選擇**把 SVG 路徑內嵌**，因為：

1. 少一個依賴，打包更小
2. 每個圖示都吃 `currentColor`，所以文字什麼顏色，圖示就什麼顏色 — 深色模式自動對
3. 可以用 `keyof typeof` 做出型別安全（見下）

### 三個工廠函式

```ts
const brand  = (path: string) => ...          // 實心單一路徑的品牌 logo
const mark   = (viewBox, children) => ...     // 非正方形的自訂標記（你的 portfolio logo）
const stroke = (children) => ...              // 線條風格的通用圖示（信封、履歷、連結）
```

它們都是**回傳一個 React 元件的函式**。`brand('M12 .5C5...')` 執行完，
你拿到的是一個可以寫成 `<GithubIcon className="size-4" />` 的元件。

`{...props}` 這個寫法叫**展開（spread）**：把你傳進來的所有屬性
（`className`、`aria-*`…）原封不動貼到 `<svg>` 上。

### 型別魔法

```ts
export const icons = { github: ..., linkedin: ..., ... } as const
export type IconName = keyof typeof icons
```

拆開看：

- `typeof icons` — 拿到「icons 這個物件的型別」
- `keyof ...` — 拿到「這個型別所有 key 的聯集」

結果：`IconName` 自動等於所有已註冊的名字。
**你在這裡新增一個圖示，`links.ts` 立刻就能填那個名字，不用改任何型別定義。**
反過來，你刪掉一個圖示但 `links.ts` 還在用 → 建置失敗。

---

## 9. 元件層 `src/components/`

### 9.1 什麼是 React 元件

一個**首字母大寫的函式**，接收一個叫 props 的物件，回傳畫面。

```tsx
export function QuoteBlock({ text, author }: Quote) {
  return <figure>...</figure>
}
```

`{ text, author }` 是**解構**：呼叫方傳進來一個物件，這裡直接把它的兩個欄位
拆成兩個變數。`: Quote` 說明「這個 props 物件必須符合 Quote 的形狀」。

用的時候：

```tsx
<QuoteBlock text="..." author="..." />
{/* 或者展開一個現成物件： */}
<QuoteBlock {...profile.quote} />
```

**JSX** 就是那個「在 JS 裡寫 HTML」的語法。差別：
`class` → `className`，屬性用駝峰（`strokeWidth`），`{}` 裡面放 JS 運算式。

### 9.2 `App.tsx` — 版面總指揮

```tsx
const { profile, footerLinks, footer } = site   // 解構
const groups = visibleGroups(site.groups)       // 過濾
const root = useRef<HTMLElement>(null)          // 抓 <main> 的實體
useGSAP(() => playEntrance(root.current), { scope: root })
```

`useRef` 是 React 的「幫我記住那個真正的 DOM 元素」。GSAP 要動的是真實 DOM，
所以必須拿到它。`ref={root}` 掛上去之後，`root.current` 就是那個 `<main>`。

版面：

```tsx
className="mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-40 pb-16"
```

`pt-40 pb-16` 上下留白不對稱 → 整塊往下沉。
（註解裡有寫：內容超過視窗高度時 `justify-center` 會失效，這時 `pt` 就是 1:1 的下移量。）

條件渲染：

```tsx
{profile.quote && <QuoteBlock {...profile.quote} />}
```

`A && B` 在 JSX 裡讀作「A 有值才畫 B」。所以你把 `profile.ts` 的 `quote` 刪掉，
整個引言區塊就消失，不會爆錯。

### 9.3 `ProfileHeader.tsx`

```tsx
const initialsFrom = (name: string) =>
  name.split(/[\s-]+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
```

`"Yang Lin-Hsuan"` → 用空白或連字號切開 → 取前兩段 → 各取首字母大寫 → `"YL"`。
只有在圖片載入失敗時才會被看到。

```tsx
<Avatar {...avatar} initials={avatar.initials ?? initialsFrom(name)} />
```

`??` 是 nullish 合併：左邊是 `null`/`undefined` 才用右邊。
所以 `profile.ts` 有寫 `initials` 就用你的，沒寫就自動從名字算。
（這就是為什麼 `types.ts` 裡 `initials?` 是可選的。）

### 9.4 `LinkList.tsx` — 清單

```tsx
{groups.map((group) => (
  <section key={group.id}>
    <ul>{group.items.map((item) => <li key={item.id}><LinkButton item={item} /></li>)}</ul>
  </section>
))}
```

`.map()` 是「陣列 → 陣列」的轉換：每一筆資料變成一段 JSX。
`key` 是 React 用來辨認「哪一筆是哪一筆」的身分證，**列表一定要給**，
這就是 `LinkItem` 一開始就設計了 `id` 欄位的原因。

語意標籤也是刻意的：`<nav>` + `<ul>/<li>` 讓螢幕閱讀器知道這是導覽清單，
而不是一堆無關的連結。

### 9.5 `LinkButton.tsx` — 那顆膠囊按鈕

行為：平常圓點（puck）貼在右邊、顯示品牌 logo；hover 時圓點滑到左邊、
logo 換成箭頭、文字往右讓位。

```tsx
const TRAVEL = 'duration-600 ease-out group-hover:duration-1000'
const SWAP   = 'duration-200 group-hover:duration-500'
```

**為什麼抽成常數**：位移和文字讓位必須同步，分開寫遲早會改到不一致。
**為什麼進場 1000ms、退場 600ms**：滑開時應該立刻收回，用同樣長度會拖沓。

`group` / `group-hover:` 是 Tailwind 的機制：父層標 `group`，
子層寫 `group-hover:translate-x-8`，意思是「**父層**被 hover 時，我做這件事」。

`@container` + `100cqw` 見 §13.2。

### 9.6 `IconLinkRow.tsx` — 小圖示排

重點在無障礙：圖示沒有文字，所以名字要另外給。

```tsx
aria-label={item.label}   // 螢幕閱讀器唸這個
title={item.label}        // 滑鼠停住時的提示泡泡
```

`size-10`（40px）是刻意的：手指觸控目標建議至少 44×44，圖示本身只有 16px，
靠 padding 把可點範圍撐開。

### 9.7 `Avatar.tsx` — 最複雜的一個

它處理三件事：

1. **失敗退場**：`onError` → `setFailed(true)` → 改顯示縮寫
2. **取景**：`zoom` / `offsetX` / `offsetY` 怎麼變成真的位置（見 §13.1）
3. **hover 互動**：圓框從 120px 張到 130px，同時觸發波動動畫

```tsx
const [failed, setFailed] = useState(false)
const [aspect, setAspect] = useState(1)
const [open,   setOpen]   = useState(false)
```

`useState` 是 React 的「記憶 + 觸發重畫」。回傳一組
`[現在的值, 改值的函式]`。呼叫改值函式 → React 重新執行這個元件函式 → 畫面更新。

`aspect`（長寬比）為什麼要用 state：**寫程式的當下不知道圖片多大**，
要等瀏覽器載完，`onLoad` 才拿得到 `naturalWidth / naturalHeight`。
所以第一次畫用預設值 1，載完之後 setState 再畫一次正確的。

---

## 10. 動畫層 `src/animation/`

### 10.1 GSAP 基本觀念

- **tween（補間）**：從 A 狀態變到 B 狀態。`gsap.to()` 動到目標值，
  `gsap.from()` 從目標值動回現在（**進場動畫用 from**）。
- **timeline（時間軸）**：把多個 tween 排隊。
- **ease（緩動）**：速度曲線。`power2.out` = 快進慢出，最像真實物體停下來。
- **`gsap.matchMedia()`**：條件成立才跑，不成立自動還原。用來接 media query。

### 10.2 `entrance.ts` — 進場

```ts
export const entrance = { y: -16, duration: 1.5, delay: 0.15, ease: 'power2.out' } as const
```

參數抽出來放最上面，**要調動畫改這裡就好**。
`y: -16` 是負的 → 從上面 16px 滑下來（你當初要的「由上往下」）。

```ts
if (document.visibilityState === 'hidden') return
```

**這行是真的 bug 修掉的**：瀏覽器在背景分頁會把 requestAnimationFrame 降頻，
GSAP 的 tween 就會卡在 `autoAlpha: 0`，使用者切回來看到一片空白。
沒人在看就不用演，直接顯示內容。

```ts
mm.add('(prefers-reduced-motion: no-preference)', () => {
  gsap.from(target, { autoAlpha: 0, y, duration, ease, delay, clearProps: 'transform,opacity,visibility' })
})
```

- `autoAlpha` 比 `opacity` 好：值為 0 時它會順便設 `visibility: hidden`，
  透明的東西就不會擋住點擊。
- `prefers-reduced-motion` 是作業系統的「減少動態效果」設定。有些人看動畫會頭暈，
  所以尊重它是無障礙的基本要求。
- `clearProps` 動完之後把 GSAP 寫進去的 inline style 清掉，樣式交還給 CSS。

**注意 `App.tsx` 只把 `<main>` 一個元素交給它**，所以整塊一起動、沒有先後順序
（這是你當初明確要求的「不要有順序」）。

### 10.3 `avatarRing.ts` — 頭貼 hover 的波動框

動的是**取景框自己的 `border-radius`**，在四組不規則圓角之間循環：

```ts
const shapes = ['58% 42% 45% 55% / 48% 45% 55% 52%', ...]
```

四組的**結構必須一模一樣**（八個百分比 + 中間一條斜線），GSAP 才有辦法
逐個數字做補間。

為什麼不用 `rotation` 製造「繞著跑」的感覺：轉的話裡面的照片會跟著轉。
所以改成讓形狀本身輪替。

回傳一個 `{ show, hide }` 給元件的 hover 事件用：

```ts
export type RingWobble = { show: () => void; hide: () => void }
```

`show()` 裡的 `loop.invalidate().restart()`：`invalidate` 讓 keyframes 忘掉
上次記住的起點，改從「現在的形狀」接下去 — 所以中途滑開再滑回來不會跳一下。

### 10.4 `useGSAP()` 為什麼一定要用

```tsx
useGSAP(() => { ... }, { scope: box })
```

React 元件會被反覆建立與銷毀。動畫如果沒人收拾，元件消失後動畫還在跑，
就會記憶體洩漏或報錯。`useGSAP` 幫你在卸載時自動 revert 所有在裡面建立的動畫。
`scope` 限定選擇器只在這個元素內找。

---

## 11. 樣式層 `src/index.css`

### Tailwind 是什麼

不是「幫你寫好的元件庫」，而是**一套原子級的 CSS class**。
`px-6` = `padding-left/right: 1.5rem`，`flex` = `display: flex`。

好處：不用取 class 名字、不用在兩個檔案間跳、刪元件時樣式自動跟著消失。

### 這個專案的三層設計

**第一層：語意 token（`:root`）**

```css
:root {
  --page: #fafafa;      --raised: #ffffff;
  --ink: #18181b;       --ink-muted: #71717a;   --ink-faint: #a1a1aa;
  --line: #e6e6e4;      --ring: #18181b;
}
```

名字取的是**用途**（page / ink / line）而不是顏色（gray-50 / zinc-900）。
這是重點：換配色只改這裡，元件一行都不用動。

**第二層：深色模式**

```css
@media (prefers-color-scheme: dark) { :root { --page: #0c0c0d; --ink: #f4f4f5; ... } }
```

只換掉變數的值。因為元件寫的是 `text-ink` 而不是 `text-zinc-900`，
所以**整站深色模式是免費的，沒有任何一個元件需要寫 `dark:` 前綴**。

**第三層：接到 Tailwind**

```css
@theme inline {
  --color-page: var(--page);
  --color-ink: var(--ink);
  --font-serif: 'Newsreader', ui-serif, Georgia, serif;
  --shadow-raised: var(--shadow);
}
```

`@theme` 是 Tailwind v4 的做法（v3 是寫 `tailwind.config.js`，**v4 不需要那個檔案了**）。
在這裡登記 `--color-ink`，Tailwind 就自動生出 `text-ink` / `bg-ink` / `border-ink` 這些 class。

### 其他

```css
:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
```

鍵盤使用者按 Tab 時要看得到自己在哪。`:focus-visible`（而不是 `:focus`）
的好處是滑鼠點擊不會出現這個框。

```css
@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.1ms !important; } }
```

全站的 CSS 過場也一併關掉（GSAP 那邊由 `matchMedia` 各自處理）。

`body` 的背景是 `radial-gradient` + 底色，`background-attachment: fixed` 讓它
不跟著捲動 — 這是那個「畫面下方微微亮起來」的效果。

---

## 12. 常見修改食譜

| 我想… | 改哪裡 |
|---|---|
| 改名字 / 一句自介 | `src/data/profile.ts` |
| 改引言 | `src/data/profile.ts` 的 `quote` |
| 拿掉引言 | 刪掉 `quote` 整個欄位（`App.tsx` 會自動不畫） |
| 加 / 刪 / 排序按鈕 | `src/data/links.ts` 的 `groups[0].items` |
| 暫時藏一顆按鈕但保留資料 | 那筆加 `hidden: true` |
| 改 copyright 上面的小圖示 | `src/data/links.ts` 的 `footerLinks` |
| 換頭貼 | 換 `public/avatar.webp`，再調 `profile.ts` 的 `zoom` / `offsetX` / `offsetY` |
| 頭貼大小 | `src/components/Avatar.tsx` 的 `AVATAR_SIZE`（hover 大小是 `AVATAR_HOVER_SIZE`） |
| 按鈕高度 | `LinkButton.tsx` 的 `h-12` |
| 按鈕間距 | `LinkList.tsx` 的 `gap-2.5` |
| 整體版面寬度 | `App.tsx` 的 `max-w-[28rem]` |
| 整體上下位置 | `App.tsx` 的 `pt-48` / `pb-8`（pt 加多少、pb 減多少 = 往下多少） |
| 區塊之間的距離 | `App.tsx` 的 `gap-9` |
| 配色 | `src/index.css` 的 `:root`（淺色）和 `@media (prefers-color-scheme: dark)`（深色） |
| 字體 | `index.html` 的 Google Fonts `<link>` + `index.css` 的 `--font-sans` / `--font-serif` |
| 進場動畫快慢 / 方向 | `src/animation/entrance.ts` 最上面的 `entrance` 物件 |
| 按鈕 hover 圓點速度 | `LinkButton.tsx` 的 `TRAVEL` 常數 |
| 頭貼波動速度 | `avatarRing.ts` 的 `MORPH` / `FLOAT` / `SETTLE` |
| 新增一個平台圖示 | `src/icons/registry.tsx` 加一個 key，然後就能在 `links.ts` 用了 |

### 新增圖示的完整步驟

1. 找到該品牌的 SVG，取出 `<path>` 的 `d` 值（要是 24×24 viewBox 的單一路徑）
2. 在 `registry.tsx` 的 `icons` 物件加一行：`myicon: brand('M12 ...'),`
3. 在 `links.ts` 寫 `icon: 'myicon'` — 編輯器會自動補完

如果是線條風格（非實心），用 `stroke(<>...</>)`；非正方形用 `mark('0 0 W H', <>...</>)`。

### 換頭貼的完整步驟

原始檔通常是 HEIC 或大張 JPG，要先轉成 WebP（檔案小很多、畫質一樣）：

```bash
# HEIC 先解成 PNG（macOS 內建 sips 讀得懂 HEIC，但寫不出 WebP）
sips -s format png avatar-source.heic --out /tmp/avatar.png
# 再壓成 WebP，同時縮到接近實際顯示尺寸的 2～3 倍
npx --yes sharp-cli -i /tmp/avatar.png -o public/ resize 560 --format webp -q 90
```

**為什麼要先縮小**：瀏覽器把 3000px 的圖降到 144px 顯示時，
降取樣會產生雜訊感（你之前看到的「有噪音」就是這個）。
先用 sharp 的 Lanczos 演算法縮好，畫面會乾淨很多。

---

## 13. 三個比較難的細節

這三段是這個專案裡真的踩過坑、然後想清楚的地方。看不懂可以先跳過。

### 13.1 頭貼的取景數學（`Avatar.tsx` 的 `resolveNudge`）

**問題**：你想把照片在圓框裡往右下推一點，推太多就會在圓的另一側露出白邊。

**為什麼**：能推的空間有兩個來源，而且**大小不一樣**：

1. **`object-fit: cover` 的裁切餘裕**
   照片不是正方形，塞進正方形框時，長的那一邊會被裁掉。
   `object-position` 就是在滑動這個裁切窗 — 這部分**完全免費，永遠不會露白**。
2. **`zoom` 造成的溢出**
   `zoom: 1.2` 讓圖片實際是 144px、框是 120px，兩邊各多出 12px。
   移動圖片本身（`left` / `top`）只能在這 12px 內，超過就露底。

`resolveNudge()` 做的事：**先用免費的第 1 種，用完了才動用第 2 種，
兩種都用完就封頂**。所以現在無論 `offsetX` 填多大，都不會再出現白邊。

```ts
const cropBudget     = slack / 2                                    // 第 1 種的額度
const overhangBudget = Math.max((rendered - frame) / (2*frame) - 1/frame, 0)  // 第 2 種
const total   = Math.min(|offset|/100, cropBudget + overhangBudget) // 封頂
const viaCrop = Math.min(|total|, cropBudget)                       // 優先吃免費的
```

那個 `- 1/frame` 是**故意少算 1px**：在非整數的螢幕縮放比例下，
剛好切齊的邊緣可能被四捨五入成一條髮絲般的白線。

**另外兩個相關的坑**：

- **`zoom` 用的是圖片的真實尺寸，不是 CSS `transform: scale()`**。
  用 transform 的話，瀏覽器是先把原圖降到 120px、再把那張已經失真的點陣圖放大 →
  雜訊。改成直接指定 `width/height`，瀏覽器只採樣一次，直接採到最終尺寸。
- **邊框用 `outline` 不用 `border`**。`border` 會縮小內容盒，
  而裡面的 `<img>` 是 `absolute` 定位在內容盒上 → 永遠差 1px，就會有白邊。
  `outline` 不影響版面，畫在原地。

### 13.2 圓點的位移距離（`@container` / `cqw`）

圓點要從右邊滑到左邊，距離 = 按鈕寬度 − 圓點寬度 − 兩側內縮。
但按鈕是 `width: 100%`，**寫程式時不知道它幾 px**。

解法：CSS 容器查詢。

```tsx
className="group @container relative flex h-12 ..."
{/* 位移： */}
group-hover:-translate-x-[calc(100cqw-47px)]
```

`@container` 讓這顆按鈕變成一個「容器」，`100cqw` 就是**它自己的寬度**。
好處：動的是 `transform`，不是 `right` — transform 不觸發重新排版，每一幀都便宜。

**踩過的坑**：`cqw` 是以**內容盒**計算的。原本內距寫在 `<a>` 上
（`pl-6 pr-14` = 80px），`100cqw` 就變成「寬度 − 80px」，圓點永遠滑不到底。
**修法：把內距移到裡面那個 `<span>`**，讓 `<a>` 自己沒有內距。

`47px` 的來源：圓點 40px（`size-10`）+ 兩側各 3.5px 內縮。
那個 3.5 而不是 4，是因為外框是 `border-[0.5px]`，上下左右各吃掉 0.5px。

### 13.3 為什麼「資料先、內容後」

你當初說「先建立好資料架構再開始做內容」，這句話的具體回報是：

- 改文案不用碰 React
- icon 打錯字建置就爆，不會上線才發現
- 深色模式沒有寫任何一行 `dark:`
- 想加第二組連結（Work / Personal），`LinkGroup` 已經支援，元件不用改
- 想暫時藏一顆按鈕，`hidden: true` 就好，不用註解掉程式碼

代價是一開始多寫了 `types.ts` 和 `selectors.ts` 兩個「沒有畫面」的檔案。
這就是架構的取捨：**前期多花一點，後期每一次修改都省一點**。

---

## 14. 名詞表

| 名詞 | 白話 |
|---|---|
| **模組 module** | 一個 `.ts` / `.tsx` 檔案 |
| **匯出 export** | 讓別的檔案看得到 |
| **匯入 import** | 拿別的檔案公開的東西 |
| **barrel** | 一個只做轉出的 `index.ts`，當作資料夾的門面 |
| **循環依賴** | A 需要 B、B 又需要 A。會出怪事，本專案刻意避免 |
| **entry point** | 程式的第一行，這裡是 `src/main.tsx` |
| **元件 component** | 首字大寫、回傳 JSX 的函式 |
| **props** | 傳給元件的參數物件 |
| **state** | 元件自己記住、改了會重畫的值（`useState`） |
| **ref** | 指向真實 DOM 元素的把手（`useRef`） |
| **JSX** | 在 JS 裡寫 HTML 的語法 |
| **解構 destructuring** | `const { a, b } = obj`，把欄位拆成變數 |
| **展開 spread** | `{...obj}`，把物件所有欄位攤開 |
| **`?.`** | 可選鏈：前面是 null 就整串回 undefined，不報錯 |
| **`??`** | 左邊是 null/undefined 才用右邊 |
| **interface** | TypeScript 的形狀說明書 |
| **聯集型別 union** | `'a' \| 'b'`，只能是其中之一 |
| **`keyof typeof x`** | 拿到物件 x 所有 key 的聯集 |
| **tween** | 一段從 A 到 B 的動畫 |
| **ease** | 動畫的速度曲線 |
| **utility class** | Tailwind 那種一個 class 一件事的寫法 |
| **CSS 變數 / token** | `--ink: #18181b`，用 `var(--ink)` 取用 |
| **SPA** | 單頁應用：HTML 是空的，畫面由 JS 生成 |
| **靜態網站** | 沒有後端，建置完就是一堆檔案 |
| **HMR** | 熱更新：`npm run dev` 時改檔案，畫面立刻更新不用重整 |

---

## 附錄：還沒處理的小地方

留給你自己動手練習：

1. **引言的引號重複了**。`profile.ts` 的字串本身有 `“ ”`，`QuoteBlock.tsx` 第 7 行
   又包了一層 `“{text}”`，所以畫面上是 `““…””`。
   **二選一**：刪掉字串裡的引號，或把第 7 行改成 `{text}`。不要兩個都做。
2. **`links.ts` 還有預留位置**：`mailto:hello@example.com` 和 `/resume.pdf`
   （後者需要你真的把 `resume.pdf` 放進 `public/`）。
3. **`site.ts` 的 `url: 'https://example.com'`** 要換成真正的網址。
4. **README 寫的是 `public/avatar.jpg`**，實際是 `avatar.webp`，可以順手改掉。
