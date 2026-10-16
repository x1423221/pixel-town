// 回憶畫面（閃回）用的背景：畫面比遊戲放大一倍（96 × 132），人物看起來比較近
//   konbini 便利商店   street 傍晚的街道   room 房間（架上放著那盒捨不得吃的牛奶糖）
// 人物的腳踩在 FEET 這條線上；下面留給對話框

export const FB_W = 96
export const FB_H = 132
export const FEET = 84

function p(ctx, x, y, w, h, c) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

function rnd(i) { // 固定的亂數，商品每次畫都一樣
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// 小小的牛奶糖盒（白底＋中間粉紅）
export function smallCandy(ctx, x, y) {
  p(ctx, x - 1, y - 1, 10, 6, '#5a4a52')
  p(ctx, x, y, 8, 4, '#fbf7ee')
  p(ctx, x + 2, y, 4, 4, '#f2b8c6')
  p(ctx, x + 3, y + 1, 2, 1, '#c8283a')
  p(ctx, x, y, 8, 1, '#ffffff')
}

function konbini(ctx, t) {
  p(ctx, 0, 0, FB_W, FB_H, '#f4efe2')            // 牆
  p(ctx, 0, 0, FB_W, 7, '#e2ddd0')               // 天花板
  const flicker = Math.floor(t / 1800) % 7 === 0 ? '#e8f4ff' : '#ffffff'
  p(ctx, 8, 3, 26, 2, flicker); p(ctx, 54, 3, 26, 2, '#ffffff') // 日光燈
  p(ctx, 0, 9, FB_W, 2, '#3a8a5a'); p(ctx, 0, 11, FB_W, 2, '#f3efe8'); p(ctx, 0, 13, FB_W, 2, '#2e6ab0') // 招牌色帶

  // 貨架
  p(ctx, 3, 20, 58, 50, '#d8d2c4')
  p(ctx, 3, 20, 58, 2, '#b8b2a6')
  const boards = [33, 47, 61]
  const colors = ['#e05a4a', '#f2c230', '#5aa0d8', '#6ac07a', '#e88ab0', '#f39a3a', '#8a6ad0', '#ffffff']
  boards.forEach((by, row) => {
    for (let i = 0; i < 9; i++) {
      const h = 6 + Math.floor(rnd(row * 20 + i) * 5)
      const c = colors[Math.floor(rnd(row * 31 + i * 7) * colors.length)]
      p(ctx, 5 + i * 6, by - h, 5, h, c)
      p(ctx, 5 + i * 6, by - h, 5, 1, '#ffffff')
    }
    p(ctx, 3, by, 58, 2, '#9a9488')
  })
  p(ctx, 3, 68, 58, 2, '#8a8478')

  // 自動門（右邊）
  p(ctx, 68, 18, 26, 52, '#8a8a96')
  p(ctx, 70, 20, 10, 50, '#bfe3ef'); p(ctx, 82, 20, 10, 50, '#bfe3ef')
  p(ctx, 71, 22, 2, 30, '#e8f7fc'); p(ctx, 83, 22, 2, 30, '#e8f7fc')
  p(ctx, 80, 20, 2, 50, '#6a6a76')

  // 地板
  p(ctx, 0, 70, FB_W, FB_H - 70, '#dcd8cc')
  for (let x = 0; x < FB_W; x += 12) p(ctx, x, 70, 1, FB_H - 70, '#cbc6b9')
  for (let y = 70; y < FB_H; y += 10) p(ctx, 0, y, FB_W, 1, '#cbc6b9')
}

function street(ctx, t) {
  const sky = ['#f6b9a0', '#ec9a98', '#c8849e', '#9a78a8', '#6e6a9e']
  sky.forEach((c, i) => p(ctx, 0, i * 9, FB_W, 9, c))
  p(ctx, 0, 45, FB_W, 25, '#5a5a8e')
  // 大樓剪影＋窗戶
  const blds = [[0, 30, 18], [16, 22, 14], [28, 36, 20], [46, 26, 16], [60, 18, 14], [72, 32, 24]]
  blds.forEach(([x, y, w], i) => {
    p(ctx, x, y, w, 70 - y, '#3a3552')
    for (let wy = y + 4; wy < 64; wy += 6) for (let wx = x + 3; wx < x + w - 2; wx += 5) {
      if (rnd(i * 50 + wx + wy) > 0.45) p(ctx, wx, wy, 2, 3, '#ffd98a')
    }
  })
  // 路燈
  p(ctx, 78, 30, 2, 40, '#2a2638')
  p(ctx, 74, 28, 10, 3, '#2a2638')
  const glow = 0.25 + Math.sin(t / 600) * 0.05
  ctx.fillStyle = `rgba(255, 220, 140, ${glow})`
  ctx.beginPath(); ctx.arc(79, 34, 12, 0, Math.PI * 2); ctx.fill()
  p(ctx, 76, 31, 6, 3, '#ffe9a8')
  // 人行道
  p(ctx, 0, 70, FB_W, FB_H - 70, '#8a8494')
  p(ctx, 0, 70, FB_W, 2, '#a8a2b2')
  for (let x = 0; x < FB_W; x += 16) p(ctx, x, 72, 1, FB_H - 72, '#7a7486')
  for (let y = 82; y < FB_H; y += 12) p(ctx, 0, y, FB_W, 1, '#7a7486')
}

function room(ctx, t) {
  p(ctx, 0, 0, FB_W, 70, '#ecdcc6')                    // 牆
  for (let y = 4; y < 70; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < FB_W; x += 8) p(ctx, x, y, 1, 1, '#dcc8ae')
  // 窗戶（夜晚）
  p(ctx, 58, 10, 30, 30, '#6a4a3a')
  p(ctx, 60, 12, 26, 26, '#2a3260')
  p(ctx, 72, 12, 2, 26, '#6a4a3a'); p(ctx, 60, 24, 26, 2, '#6a4a3a')
  p(ctx, 64, 15, 1, 1, '#ffffff'); p(ctx, 80, 18, 1, 1, '#ffffff'); p(ctx, 67, 30, 1, 1, '#ffffff')
  p(ctx, 54, 8, 6, 36, '#e8a0a8'); p(ctx, 86, 8, 6, 36, '#e8a0a8') // 窗簾
  // 牆上的層架：小盆栽、相框、那盒牛奶糖（被好好地擺著）
  p(ctx, 6, 34, 40, 3, '#8a5a3a'); p(ctx, 6, 37, 40, 1, '#6a4428')
  p(ctx, 9, 27, 6, 7, '#c86a4a'); p(ctx, 8, 22, 8, 6, '#5aa06a'); p(ctx, 10, 20, 3, 3, '#6ac07a') // 盆栽
  p(ctx, 34, 24, 9, 10, '#f3efe8'); p(ctx, 35, 25, 7, 8, '#9ac0e0')                                // 相框
  smallCandy(ctx, 21, 29)
  // 小小的光暈，讓那盒糖特別一點
  const a = 0.18 + Math.sin(t / 500) * 0.08
  ctx.fillStyle = `rgba(255, 240, 200, ${a})`
  ctx.beginPath(); ctx.arc(25, 31, 8, 0, Math.PI * 2); ctx.fill()
  // 木頭地板
  p(ctx, 0, 70, FB_W, FB_H - 70, '#b08a64')
  for (let y = 70; y < FB_H; y += 7) p(ctx, 0, y, FB_W, 1, '#9a7654')
  for (let y = 70, k = 0; y < FB_H; y += 7, k++) p(ctx, (k * 23) % FB_W, y, 1, 7, '#9a7654')
}

// ---------- 未來的回憶 ----------
function cardboard(ctx, x, y, w, h, mark) {
  p(ctx, x, y, w, h, '#c8965a')
  p(ctx, x, y, w, 2, '#d8aa70')
  p(ctx, x + Math.floor(w / 2) - 1, y, 2, h, '#b07e46')   // 膠帶
  p(ctx, x, y + h - 1, w, 1, '#9a6a3a')
  if (mark) { p(ctx, x + 2, y + 4, 6, 3, '#fbf7ee'); p(ctx, x + 4, y + 4, 2, 3, '#f2b8c6') } // 牛奶糖標記
}

// 新家：空空的房間＋一堆紙箱（白天）
function newhome(ctx) {
  p(ctx, 0, 0, FB_W, 70, '#f3ece0')
  p(ctx, 0, 62, FB_W, 8, '#e2d6c4')                     // 踢腳板
  p(ctx, 30, 10, 36, 30, '#f8f4ec')                    // 大窗
  p(ctx, 32, 12, 32, 26, '#bfe3f4')
  p(ctx, 47, 12, 2, 26, '#f8f4ec'); p(ctx, 32, 24, 32, 2, '#f8f4ec')
  p(ctx, 35, 14, 6, 2, '#ffffff'); p(ctx, 52, 16, 8, 2, '#ffffff') // 雲
  ctx.fillStyle = 'rgba(255, 248, 220, 0.35)'
  ctx.beginPath(); ctx.moveTo(32, 38); ctx.lineTo(64, 38); ctx.lineTo(80, 70); ctx.lineTo(20, 70); ctx.fill() // 陽光
  p(ctx, 0, 70, FB_W, FB_H - 70, '#c8a47c')
  for (let y = 70; y < FB_H; y += 7) p(ctx, 0, y, FB_W, 1, '#b48e66')
  cardboard(ctx, 2, 48, 18, 22); cardboard(ctx, 4, 32, 14, 16, true); cardboard(ctx, 74, 52, 20, 18)
}
function newhomeFront(ctx) {
  cardboard(ctx, 70, 78, 22, 16)
}

// 很普通的晚上：客廳、電視、沙發（沙發畫在人物前面，看起來像坐著）
function living(ctx, t) {
  p(ctx, 0, 0, FB_W, 70, '#5a4a6a')
  for (let y = 6; y < 70; y += 10) p(ctx, 0, y, FB_W, 1, '#54445f')
  p(ctx, 0, 70, FB_W, FB_H - 70, '#7a5a48')
  for (let y = 70; y < FB_H; y += 7) p(ctx, 0, y, FB_W, 1, '#6a4c3c')
  // 電視（左邊）＋藍光
  p(ctx, 2, 36, 22, 16, '#1c1c24')
  const flick = Math.floor(t / 900) % 3
  p(ctx, 4, 38, 18, 12, ['#5a8ad0', '#6a9ae0', '#4a7ac0'][flick])
  p(ctx, 10, 52, 6, 2, '#1c1c24'); p(ctx, 0, 54, 28, 16, '#6a4a3a'); p(ctx, 0, 54, 28, 2, '#8a6a4a')
  ctx.fillStyle = 'rgba(120, 170, 255, 0.12)'
  ctx.beginPath(); ctx.arc(13, 44, 26, 0, Math.PI * 2); ctx.fill()
  // 立燈（右邊）＋暖光
  p(ctx, 86, 30, 2, 40, '#3a2a2a'); p(ctx, 81, 24, 12, 7, '#f4d8a0')
  ctx.fillStyle = 'rgba(255, 210, 140, 0.18)'
  ctx.beginPath(); ctx.arc(87, 30, 22, 0, Math.PI * 2); ctx.fill()
  p(ctx, 60, 14, 14, 10, '#f3efe8'); p(ctx, 61, 15, 12, 8, '#d98aa0') // 牆上的畫
}
function livingFront(ctx) {
  p(ctx, 30, 70, 58, 6, '#8a4a5a')          // 椅背（低一點，看得到上半身）
  p(ctx, 30, 70, 58, 2, '#a65a6c')
  p(ctx, 28, 76, 62, 12, '#7a3e4e')          // 坐墊
  p(ctx, 26, 70, 6, 18, '#6a3442'); p(ctx, 86, 70, 6, 18, '#6a3442') // 扶手
  p(ctx, 30, 88, 3, 3, '#3a2a2a'); p(ctx, 85, 88, 3, 3, '#3a2a2a')
  p(ctx, 32, 71, 8, 6, '#f2c230')            // 抱枕
}

// 很久很久以後：夜晚的港口（煙火另外畫）
function harborOld(ctx) {
  const sky = ['#0e1230', '#141a3e', '#1b2250', '#24305e']
  sky.forEach((c, i) => p(ctx, 0, i * 10, FB_W, 10, c))
  for (let i = 0; i < 14; i++) p(ctx, Math.floor(rnd(i) * FB_W), Math.floor(rnd(i + 40) * 34), 1, 1, '#8a94d0')
  p(ctx, 0, 40, FB_W, 8, '#2a2e58')
  for (let x = 0; x < FB_W; x += 7) p(ctx, x, 42 + (x % 3), 4, 2, rnd(x) > 0.5 ? '#ffd98a' : '#7ad7ff') // 對岸的燈
  p(ctx, 0, 48, FB_W, 16, '#1c2a5a')
  for (let i = 0; i < 10; i++) p(ctx, Math.floor(rnd(i + 9) * 90), 50 + Math.floor(rnd(i + 3) * 12), 4, 1, '#f2c26a') // 水面倒影
  p(ctx, 0, 62, FB_W, 2, '#e8dcc0'); for (let x = 2; x < FB_W; x += 6) p(ctx, x, 64, 2, 6, '#e8dcc0') // 欄杆
  p(ctx, 0, 70, FB_W, FB_H - 70, '#6a6070')
  for (let x = 0; x < FB_W; x += 14) p(ctx, x, 70, 1, FB_H - 70, '#5a5060')
  for (let y = 80; y < FB_H; y += 12) p(ctx, 0, y, FB_W, 1, '#5a5060')
}

const BACKDROPS = { konbini, street, room, newhome, living, harborOld }
const FRONTS = { newhome: newhomeFront, living: livingFront }

export function drawBackdrop(ctx, name, t) {
  ;(BACKDROPS[name] || street)(ctx, t)
}
// 畫在人物前面的東西（沙發、紙箱）
export function drawForeground(ctx, name, t) {
  FRONTS[name]?.(ctx, t)
}

// 變成老爺爺老奶奶：把頭髮換成白髮
const OLD_HAIR = { '#1f1b26': '#c8c8d2', '#3d3850': '#ececf2', '#2b1e24': '#d0ccd4', '#4d3843': '#f0eef4' }
const oldCache = new Map()
export function agedCanvas(img, key) {
  if (oldCache.has(key)) return oldCache.get(key)
  const c = document.createElement('canvas')
  c.width = img.width; c.height = img.height
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, c.width, c.height)
  const hex = (n) => n.toString(16).padStart(2, '0')
  for (let i = 0; i < data.data.length; i += 4) {
    if (!data.data[i + 3]) continue
    const to = OLD_HAIR[`#${hex(data.data[i])}${hex(data.data[i + 1])}${hex(data.data[i + 2])}`]
    if (!to) continue
    data.data[i] = parseInt(to.slice(1, 3), 16); data.data[i + 1] = parseInt(to.slice(3, 5), 16); data.data[i + 2] = parseInt(to.slice(5, 7), 16)
  }
  ctx.putImageData(data, 0, 0)
  oldCache.set(key, c)
  return c
}
