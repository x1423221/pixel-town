// 天色：依「日本時間」決定天空顏色、天黑的程度
//   每一幀 SceneView 會呼叫 updateLight(現在時間)，各區的畫風再用 light 來畫天空、開燈
//   測試用：網址加 ?hour=18.5 可以直接指定時間（18:30）
import { px } from './sceneArt.js'

const params = new URLSearchParams(location.search)
const forcedHour = params.has('hour') ? Number(params.get('hour')) : null

// 一天裡的幾個關鍵時刻：天空由上到下 4 個顏色
const KEYS = [
  [0, ['#0c1028', '#10163a', '#151d48', '#1a2454']],    // 深夜
  [4.8, ['#0e1430', '#141c44', '#1c2452', '#262c5e']],  // 天快亮
  [5.8, ['#2a3468', '#4a4a86', '#8a6a9a', '#d8949a']],  // 黎明
  [6.6, ['#6a8ac8', '#9aa8d8', '#e8b8b0', '#fbd4a0']],  // 日出
  [7.6, ['#6cb0e2', '#86c0ea', '#a2d2f0', '#c0e2f6']],  // 早上
  [15.6, ['#6aaee0', '#84bee8', '#a0cfee', '#bcdff4']], // 下午
  [16.5, ['#5a7ab8', '#8a90c8', '#e0a8a8', '#f8c890']], // 傍晚
  [17.2, ['#4a5aa0', '#9a78b8', '#f2a08a', '#fcd89a']], // 夕陽
  [18.0, ['#242a5c', '#3e3c7c', '#7a5a92', '#c07a84']], // 黃昏
  [19.0, ['#10163a', '#151d48', '#1a2454', '#202a5c']], // 入夜
  [24, ['#0c1028', '#10163a', '#151d48', '#1a2454']],
]

const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0')
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
// 兩個顏色之間取中間色（t = 0 是 a，1 是 b）
export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b)
  return '#' + A.map((v, i) => hex2(v + (B[i] - v) * Math.max(0, Math.min(1, t)))).join('')
}

// 天黑的程度：白天 0、晚上 1，黃昏和清晨慢慢變
function darknessAt(h) {
  if (h >= 7 && h <= 16.6) return 0
  if (h > 16.6 && h < 19) return (h - 16.6) / 2.4
  if (h >= 4.6 && h < 7) return 1 - (h - 4.6) / 2.4
  return 1
}

export const light = { hour: 12, dark: 0, sky: KEYS[5][1] }

export function updateLight(nowMs) {
  const h = forcedHour ?? ((nowMs / 3600000 + 9) % 24) // 日本時間（UTC+9）
  let i = 0
  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++
  const [h0, c0] = KEYS[i], [h1, c1] = KEYS[i + 1]
  const t = (h - h0) / (h1 - h0)
  light.hour = h
  light.dark = darknessAt(h)
  light.sky = c0.map((c, k) => mix(c, c1[k], t))
}

// 一層一層的天空（像素風）：height 是天空總高度，切成 n 層
export function skyBands(ctx, viewW, height, n = 6) {
  const h = Math.ceil(height / n)
  for (let k = 0; k < n; k++) {
    const u = (k / (n - 1)) * 3 // 對應到 4 個關鍵色之間
    const i = Math.min(2, Math.floor(u))
    px(ctx, 0, k * h, viewW, h, mix(light.sky[i], light.sky[i + 1], u - i))
  }
}

// 只有天黑才看得到的東西用這個透明度
export const nightAlpha = () => Math.max(0, (light.dark - 0.35) / 0.65)

// 燈的光暈（一圈一圈的半透明，像素風）
export function glow(ctx, x, y, r, color = '255, 214, 140', strength = 1) {
  const a = nightAlpha() * strength
  if (a <= 0) return
  ;[[r, 0.1], [r * 0.6, 0.16], [r * 0.3, 0.22]].forEach(([rr, al]) => {
    ctx.fillStyle = `rgba(${color}, ${al * a})`
    ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), rr, 0, Math.PI * 2); ctx.fill()
  })
}
