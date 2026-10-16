// 場景用的像素圖：地圖格子、路人、物件、放大鏡
// 視角：斜前方看過去（像經典 RPG），街道左右延伸，建築物都看得到正面
import { drawGirl, drawBoy } from './characters.js'

export const TILE = 24

const COL = {
  walk: '#8a8496', walkLine: '#7a7486',
  sky: '#141a33', skyStar: '#4a5490',
  concrete: '#8a8e9c', concreteDark: '#6b6f80', concreteLight: '#a8acb8', concreteLine: '#5a5e6e',
  wall: '#5b5f7e', roof: '#3a3e58', window: '#ffd166', windowOff: '#2e3248',
  outline: '#2b2233',
}

const AWNINGS = [['#d84a3a', '#f3efe8'], ['#2f8a5a', '#f3efe8'], ['#2e6ab0', '#f3efe8'], ['#e0a020', '#fff2c8']]

// 依座標產生固定的亂數，讓同一格每次畫都一樣
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

function street(ctx, X, Y, tx, ty) {
  px(ctx, X, Y, TILE, TILE, COL.walk)
  px(ctx, X, Y + 11, TILE, 1, COL.walkLine)
  px(ctx, X + (ty % 2 ? 5 : 17), Y, 1, 11, COL.walkLine)
  px(ctx, X + (ty % 2 ? 17 : 5), Y + 12, 1, 12, COL.walkLine)
  if (hash(tx, ty) > 0.8) px(ctx, X + 8, Y + 18, 2, 1, '#9a94a6')
}

// ---------- 攤位檯子（正面）：上半部是堆起來的商品，下半部是木頭檯面＋價格牌 ----------
function stallTable(ctx, X, Y, kind, tx, ty, withBackdrop = true) {
  if (withBackdrop) px(ctx, X, Y, TILE, TILE, '#3a2e3a') // 後面的店內陰影
  px(ctx, X, Y + 13, TILE, 11, '#7a4e2a')             // 檯子正面
  px(ctx, X, Y + 13, TILE, 2, '#9a6838')
  px(ctx, X, Y + 22, TILE, 2, '#5a3a1e')

  if (kind === 'fruit') {
    const fruit = ['#f28a2a', '#d83a3a', '#f2d24a', '#7ac84a']
    px(ctx, X + 1, Y + 9, 10, 5, '#5a3a1e'); px(ctx, X + 13, Y + 9, 10, 5, '#5a3a1e') // 籃子
    for (let i = 0; i < 7; i++) {
      const c = fruit[(i + tx) % 4]
      px(ctx, X + 1 + i * 3, Y + 6 + (i % 2) * 2, 3, 3, c)
      px(ctx, X + 2 + i * 3, Y + 4 - (i % 2), 2, 2, fruit[(i + tx + 1) % 4])
    }
  } else if (kind === 'fish') {
    px(ctx, X + 1, Y + 5, 22, 9, '#f3efe8')
    px(ctx, X + 2, Y + 6, 20, 6, '#bfe9ff')
    ;[[3, 7], [12, 9], [7, 10]].forEach(([fx, fy]) => {
      px(ctx, X + fx, Y + fy, 7, 2, '#8a96a8'); px(ctx, X + fx + 7, Y + fy - 1, 2, 4, '#8a96a8')
      px(ctx, X + fx + 1, Y + fy, 1, 1, '#1b1e30')
    })
  } else if (kind === 'candy') { // 牛奶糖：一排排粉白色長條盒
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 2; i++) {
        const bx = X + 1 + i * 12, by = Y + 3 + row * 3
        px(ctx, bx, by, 11, 3, '#fbf7ee')
        px(ctx, bx + 3, by, 5, 3, '#f2b8c6')
        px(ctx, bx + 4, by + 1, 3, 1, '#7a4a5a')
        px(ctx, bx, by + 2, 11, 1, '#d9cfc0')
      }
    }
  } else if (kind === 'snack') {
    const bags = ['#ff6f91', '#ffd166', '#4f9ad9', '#7ac84a', '#b48cff']
    for (let i = 0; i < 6; i++) {
      px(ctx, X + 1 + i * 4, Y + 5 + (i % 2) * 2, 3, 8 - (i % 2) * 2, bags[(i + tx * 2) % 5])
      px(ctx, X + 1 + i * 4, Y + 5 + (i % 2) * 2, 3, 1, '#f3efe8')
    }
  } else if (kind === 'dried') {
    ;[1, 9, 17].forEach((sx, i) => {
      px(ctx, X + sx, Y + 5, 6, 9, i % 2 ? '#b8865a' : '#d9c39a')
      px(ctx, X + sx + 1, Y + 3, 4, 2, '#7a5228')
    })
  } else { // clothes：掛起來的衣服
    px(ctx, X, Y + 1, TILE, 1, '#3a3a48')
    const shirts = ['#d84a3a', '#f3efe8', '#2e6ab0', '#2f8a5a']
    ;[1, 9, 17].forEach((sx, i) => {
      const c = shirts[(i + tx) % 4]
      px(ctx, X + sx, Y + 2, 6, 3, c); px(ctx, X + sx + 1, Y + 5, 4, 7, c)
    })
  }

  // 黃色價格牌
  ;[3, 14].forEach((sx) => {
    px(ctx, X + sx, Y + 16, 6, 4, '#ffd166')
    px(ctx, X + sx + 1, Y + 17, 4, 1, '#c23b4a')
    px(ctx, X + sx + 1, Y + 19, 2, 1, '#1b1e30')
  })
}

function kindFor(ch, tx, ty) {
  if (ch === 'F') return 'fruit'
  if (ch === 'K') return 'fish'
  if (ch === 'C') return 'candy'
  return ['snack', 'dried', 'clothes', 'snack'][Math.floor(hash(tx, ty * 3) * 4)]
}

export function drawTile(ctx, ch, tx, ty) {
  const X = tx * TILE, Y = ty * TILE
  const r = hash(tx, ty)

  switch (ch) {
    case 'V': { // 高架最上層：夜空 + 鐵軌橋面（電車另外畫在上面）
      px(ctx, X, Y, TILE, TILE, COL.sky)
      if (r > 0.6) px(ctx, X + Math.floor(r * 20), Y + 2, 1, 1, COL.skyStar)
      px(ctx, X, Y + 19, TILE, 5, COL.concreteDark)
      px(ctx, X, Y + 19, TILE, 1, COL.concreteLight)
      px(ctx, X, Y + 21, TILE, 1, '#b8bece') // 鐵軌
      for (let sx = 0; sx < TILE; sx += 6) px(ctx, X + sx, Y + 15, 1, 4, COL.concreteLine) // 護欄
      px(ctx, X, Y + 15, TILE, 1, COL.concreteLine)
      return
    }
    case 'W': { // 高架的橋樑側面（水泥）
      px(ctx, X, Y, TILE, TILE, COL.concrete)
      px(ctx, X, Y, TILE, 2, COL.concreteLight)
      px(ctx, X, Y + 9, TILE, 1, COL.concreteLine)
      px(ctx, X, Y + 21, TILE, 3, COL.concreteDark)
      ;[4, 12, 20].forEach((sx) => px(ctx, X + sx, Y + 4, 1, 1, COL.concreteLine)) // 鉚釘
      if (tx % 4 === 0) px(ctx, X, Y, 2, TILE, COL.concreteDark) // 接縫
      if (tx % 7 === 3) { px(ctx, X + 6, Y + 11, 12, 8, '#f3efe8'); px(ctx, X + 7, Y + 12, 10, 2, '#c23b4a'); px(ctx, X + 8, Y + 15, 8, 1, '#1b1e30'); px(ctx, X + 8, Y + 17, 5, 1, '#1b1e30') } // 海報
      return
    }
    case 'U': { // 高架拱門下的店：橋墩、遮雨棚、亮著燈的店內
      const [a1, a2] = AWNINGS[Math.floor(hash(tx * 3, ty * 11) * AWNINGS.length)]
      px(ctx, X, Y, TILE, TILE, '#5a4a3a')
      for (let sy = 10; sy < TILE; sy += 5) px(ctx, X + 2, Y + sy, TILE - 4, 1, '#3a2e2a') // 貨架
      for (let sx = 3; sx < TILE - 3; sx += 4) px(ctx, X + sx, Y + 12 + (sx % 3), 2, 2, ['#ffd166', '#ff8a5a', '#7ad7ff', '#9adf7a'][(sx + tx) % 4])
      for (let sx = 0; sx < TILE; sx += 4) px(ctx, X + sx, Y, 4, 7, (sx / 4) % 2 ? a2 : a1) // 遮雨棚
      for (let sx = 0; sx < TILE; sx += 4) px(ctx, X + sx + 1, Y + 7, 2, 1, a1)
      px(ctx, X + 4, Y + 8, 2, 2, '#fff2b0'); px(ctx, X + 16, Y + 8, 2, 2, '#fff2b0') // 燈泡
      if (tx % 2 === 0) { px(ctx, X, Y, 3, TILE, COL.concreteDark); px(ctx, X + 1, Y, 1, TILE, COL.concrete) } // 橋墩
      if (r > 0.55) { px(ctx, X + 9, Y + 9, 6, 13, '#f3efe8'); for (let sy = 11; sy < 21; sy += 3) px(ctx, X + 11, Y + sy, 2, 2, '#1b1e30'); px(ctx, X + 9, Y + 9, 6, 1, '#c23b4a') } // 直式招牌
      return
    }
    case 'F': case 'K': case 'A': case 'C': // 攤位檯子
      stallTable(ctx, X, Y, kindFor(ch, tx, ty), tx, ty)
      return
    case 'B': { // 靠鏡頭這側的屋簷：深色木頭 + 一排紅燈籠
      px(ctx, X, Y, TILE, TILE, '#2a1e1a')
      px(ctx, X, Y + 10, TILE, 14, '#3a2a22')
      for (let sy = 13; sy < TILE; sy += 4) px(ctx, X, Y + sy, TILE, 1, '#2a1e1a') // 木板
      px(ctx, X, Y + 10, TILE, 2, '#5a4030')
      px(ctx, X, Y + 1, TILE, 1, '#5a4a3a') // 掛燈籠的繩子
      ;[3, 15].forEach((lx) => {
        px(ctx, X + lx + 2, Y + 1, 1, 2, '#5a4a3a')
        px(ctx, X + lx, Y + 3, 6, 1, '#1b1e30')
        px(ctx, X + lx - 1, Y + 4, 8, 6, '#d83a3a')
        px(ctx, X + lx, Y + 4, 6, 6, '#e85a4a')
        px(ctx, X + lx + 1, Y + 5, 2, 3, '#ffb08a') // 燈光
        px(ctx, X + lx - 1, Y + 6, 8, 1, '#b02a2a')
        px(ctx, X + lx, Y + 10, 6, 1, '#1b1e30')
      })
      return
    }
    case 'S': { // 上野站的建築
      px(ctx, X, Y, TILE, TILE, '#c8b89a')
      px(ctx, X, Y, TILE, 2, '#e0d4bc')
      for (let sy = 5; sy < TILE - 4; sy += 9) for (let sx = 3; sx < TILE - 3; sx += 9) px(ctx, X + sx, Y + sy, 6, 5, (sx + sy + ty) % 2 ? COL.window : '#5a6a8a')
      return
    }
    case 'G': { // 上野站入口（終點）
      px(ctx, X, Y, TILE, TILE, '#1b1e30')
      px(ctx, X, Y, 3, TILE, '#c8b89a')
      px(ctx, X + 5, Y + 3, 14, 18, '#3a4a6a')
      px(ctx, X + 11, Y + 3, 1, 18, '#c8b89a')
      px(ctx, X + 6, Y + 4, 4, 6, '#9fd8ff'); px(ctx, X + 13, Y + 4, 4, 6, '#9fd8ff')
      return
    }
    case 'P': // 拱門柱子（上下各一根，中間的橫樑另外疊在最上層畫）
      street(ctx, X, Y, tx, ty)
      px(ctx, X + 7, Y, 10, TILE, '#c23b4a')
      px(ctx, X + 8, Y, 2, TILE, '#e05a6a')
      px(ctx, X + 5, Y + (ty < 5 ? 0 : TILE - 6), 14, 6, '#8e1a2a')
      return
    case '#': { // 一般建築
      px(ctx, X, Y, TILE, TILE, COL.wall)
      px(ctx, X, Y, TILE, 3, COL.roof)
      for (let wy = 6; wy < TILE - 3; wy += 8) for (let wx = 3; wx < TILE - 3; wx += 7) {
        px(ctx, X + wx, Y + wy, 4, 4, hash(tx * 7 + wx, ty * 5 + wy) > 0.4 ? COL.window : COL.windowOff)
      }
      return
    }
    default: // ',' 和 'h'：可以走的步道
      street(ctx, X, Y, tx, ty)
  }
}

// 像素字（# = 點）
const GLYPHS = {
  'ア': [
    '########.',
    '.......#.',
    '....#.#..',
    '....#....',
    '....#....',
    '...#.....',
    '..#......',
    '.#.......',
  ],
  'メ': [
    '.......#.',
    '......#..',
    '.#...#...',
    '..#.#....',
    '...#.....',
    '..#.#....',
    '.#...#...',
    '#.....#..',
  ],
  '上': [
    '....#....',
    '....#....',
    '....#####',
    '....#....',
    '....#....',
    '....#....',
    '....#....',
    '#########',
  ],
  '野': [
    '#####.####.',
    '#.#.#....#.',
    '#####...#..',
    '#.#.#.####.',
    '#####.#..#.',
    '..#....#.#.',
    '#####...#..',
    '..#.....#..',
    '..#.....#..',
    '#####..##..',
  ],
  '横': [
    '.#...#.#...',
    '.#.#######.',
    '###..#.#...',
    '.#.#######.',
    '###.......',
    '#.#.#####..',
    '.#..#.#.#..',
    '.#..#####..',
    '.#..#.#.#..',
    '.#..#####..',
    '.#..#...#..',
  ],
}

function drawText(ctx, text, x, y, color) {
  let cx = x
  for (const ch of text) {
    const g = GLYPHS[ch]
    const h = g.length
    g.forEach((row, gy) => [...row].forEach((c, gx) => {
      if (c === '#') px(ctx, cx + gx, y + gy + Math.floor((11 - h) / 2), 1, 1, color)
    }))
    cx += g[0].length + 2
  }
}

// 阿美橫町入口招牌：掛在拱門頂端，正面朝鏡頭
function drawGateSign(ctx, tx, ty) {
  const cx = tx * TILE + TILE / 2
  const W = 52, H = 21
  const x = cx - W / 2, y = ty * TILE - 14
  px(ctx, cx - 10, y + H, 2, 6, '#3a3a48'); px(ctx, cx + 8, y + H, 2, 6, '#3a3a48') // 吊架
  px(ctx, x - 2, y - 2, W + 4, H + 4, '#1b1e30')
  px(ctx, x, y, W, H, '#c23b4a')
  px(ctx, x + 2, y + 2, W - 4, H - 4, '#8e1a2a')
  for (let i = 0; i < W; i += 4) { px(ctx, x + i + 1, y - 1, 2, 1, '#ffd166'); px(ctx, x + i + 1, y + H, 2, 1, '#ffd166') } // 燈泡邊框
  drawText(ctx, 'アメ横', x + 8, y + 5, '#fff2c8')
}

// 疊在人物上方的東西：拱門橫樑和招牌（她走過時會從下面穿過）
export function drawOverlay(ctx, ch, tx, ty) {
  if (ch === 'P' && ty < 5) return drawGateSign(ctx, tx, ty)
  if (ch !== 'h') return
  const X = tx * TILE, Y = ty * TILE
  px(ctx, X + 6, Y, 12, TILE, '#c23b4a')
  px(ctx, X + 6, Y, 1, TILE, '#8e1a2a'); px(ctx, X + 17, Y, 1, TILE, '#8e1a2a')
  for (let sy = 3; sy < TILE; sy += 6) px(ctx, X + 10, Y + sy, 4, 3, '#ffd166')
}

export const SOLID = new Set(['#', 'G', 'V', 'W', 'U', 'F', 'K', 'A', 'C', 'B', 'S', 'P'])

// ---------- 山手線電車（側面）：銀色車身、窗戶、黃綠色條紋 ----------
const CAR = 64
export const TRAIN_LENGTH = (cars) => cars * (CAR + 2)

export function drawTrain(ctx, x, y, cars, headingRight) {
  for (let i = 0; i < cars; i++) {
    const cx = x + i * (CAR + 2)
    px(ctx, cx, y + 2, CAR, 17, '#c8ccd4')     // 車身
    px(ctx, cx, y + 2, CAR, 2, '#a8adb8')      // 車頂
    px(ctx, cx, y + 13, CAR, 3, '#8cc63f')     // 黃綠色條紋
    for (let wx = 4; wx < CAR - 6; wx += 9) px(ctx, cx + wx, y + 6, 6, 5, '#2a3048') // 窗戶
    ;[18, 44].forEach((dx) => { px(ctx, cx + dx, y + 5, 7, 13, '#b0b4be'); px(ctx, cx + dx + 1, y + 6, 2, 4, '#2a3048'); px(ctx, cx + dx + 4, y + 6, 2, 4, '#2a3048'); px(ctx, cx + dx, y + 13, 7, 3, '#8cc63f') }) // 車門
    if (i % 2 === 0) { px(ctx, cx + 24, y - 3, 12, 1, '#3a3a48'); px(ctx, cx + 29, y - 2, 2, 4, '#3a3a48') } // 集電弓
    px(ctx, cx, y + 18, CAR, 1, '#3a3a48')
    ;[8, CAR - 14].forEach((dx) => { px(ctx, cx + dx, y + 19, 6, 2, '#2b2233') }) // 車輪
  }
  // 車頭
  const headX = headingRight ? x + cars * (CAR + 2) - 2 : x - 6
  px(ctx, headX, y + 4, 8, 15, '#c8ccd4')
  px(ctx, headX + (headingRight ? 1 : 2), y + 5, 5, 6, '#2a3048')
  px(ctx, headX, y + 13, 8, 3, '#8cc63f')
}

// ---------- 小圖快取：把像素陣列轉成 canvas，畫的時候直接貼 ----------
const cache = new Map()

function bufferToCanvas({ w, h, pixels }) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  pixels.forEach((col, i) => {
    if (!col) return
    ctx.fillStyle = col
    ctx.fillRect(i % w, Math.floor(i / w), 1, 1)
  })
  return c
}

function cached(key, make) {
  if (!cache.has(key)) cache.set(key, bufferToCanvas(make()))
  return cache.get(key)
}

function sheet(w, h) {
  const buf = { w, h, pixels: new Array(w * h).fill(null) }
  const r = (x, y, ww, hh, c) => {
    for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
      const X = x + i, Y = y + j
      if (X >= 0 && X < w && Y >= 0 && Y < h) buf.pixels[Y * w + X] = c
    }
  }
  return { buf, r }
}

function outline(buf) {
  const out = buf.pixels.slice()
  for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) {
    if (buf.pixels[y * buf.w + x]) continue
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const X = x + dx, Y = y + dy
      return X >= 0 && X < buf.w && Y >= 0 && Y < buf.h && buf.pixels[Y * buf.w + X]
    })
    if (near) out[y * buf.w + x] = COL.outline
  }
  buf.pixels = out
  return buf
}

// 路人：跟主角同樣比例，可換髮色、外套、圍裙、頭巾、帽子
function makeNpc(colors, frame) {
  const { buf, r } = sheet(24, 37)
  const oy = 2 + frame
  const R = (x, y, w, h, c) => r(x, y + oy, w, h, c)
  R(8, 28, 3, 2, '#3c4258'); R(13, 28, 3, 2, '#3c4258')
  R(7, 30, 4, 1, '#4a3c32'); R(13, 30, 4, 1, '#4a3c32')
  R(4, 19, 2, 7, colors.coat); R(18, 19, 2, 7, colors.coat)
  R(4, 26, 2, 1, '#f7d3b8'); R(18, 26, 2, 1, '#f7d3b8')
  R(6, 18, 12, 12, colors.coat)
  if (colors.apron) { R(8, 20, 8, 10, colors.apron); R(9, 18, 1, 2, colors.apron); R(14, 18, 1, 2, colors.apron) }
  if (colors.skirt) { R(6, 23, 12, 8, colors.skirt); } // 袴
  if (colors.guitar) { R(5, 22, 9, 7, '#b0703a'); R(7, 24, 3, 3, '#3a2418'); R(13, 20, 8, 2, '#5a3a20'); R(20, 19, 2, 4, '#3a2418') } // 吉他
  R(6, 7, 12, 10, '#f7d3b8')
  R(5, 2, 14, 6, colors.hair); R(4, 4, 2, 8, colors.hair); R(18, 4, 2, 8, colors.hair)
  if (colors.cap) { R(4, 1, 16, 3, colors.cap); R(3, 4, 18, 1, '#1b1e30') }
  if (colors.band) { R(4, 5, 16, 2, colors.band); R(19, 6, 2, 3, colors.band) }
  ;[8, 14].forEach((x) => R(x, 12, 2, 2, '#2a2230'))
  R(7, 14, 2, 1, '#f2a2a0'); R(15, 14, 2, 1, '#f2a2a0')
  R(11, 15, 2, 1, '#b8564e')
  return outline(buf)
}

function makeSign() {
  const { buf, r } = sheet(24, 37)
  r(11, 20, 2, 16, '#5a4030')
  r(3, 10, 18, 11, '#c9a46a')
  r(4, 11, 16, 9, '#e8d4a8')
  r(13, 12, 2, 6, '#5a4030'); r(8, 14, 6, 2, '#5a4030'); r(14, 13, 1, 4, '#5a4030') // →
  return outline(buf)
}

// 路人側面（面向右，往左走時由畫面那邊翻轉）
function makeNpcSide(colors, frame) {
  const { buf, r } = sheet(24, 37)
  const R = (x, y, w, h, c) => r(x, y + 2, w, h, c)
  const skin = '#f7d3b8'
  if (frame === 0) { // 跨步
    R(13, 28, 3, 2, '#3c4258'); R(13, 30, 4, 1, '#4a3c32')
    R(8, 28, 3, 2, '#3c4258'); R(7, 30, 4, 1, '#4a3c32')
  } else {
    R(10, 28, 4, 2, '#3c4258'); R(10, 30, 5, 1, '#4a3c32')
  }
  R(8, 18, 9, 12, colors.coat)
  if (colors.apron) R(14, 20, 3, 10, colors.apron)
  if (colors.skirt) R(7, 23, 11, 8, colors.skirt)
  if (frame === 0) { R(13, 19, 3, 6, colors.coat); R(15, 25, 2, 1, skin) }
  else { R(9, 19, 3, 6, colors.coat); R(8, 25, 2, 1, skin) }
  R(8, 7, 10, 10, skin)
  R(18, 11, 1, 2, skin)
  R(6, 2, 12, 5, colors.hair); R(6, 7, 5, 6, colors.hair); R(15, 7, 3, 1, colors.hair)
  if (colors.cap) { R(6, 1, 13, 3, colors.cap); R(15, 4, 5, 1, '#1b1e30') }
  R(14, 11, 2, 2, '#2a2230')
  R(14, 14, 2, 1, '#f2a2a0')
  R(16, 15, 1, 1, '#b8564e')
  return outline(buf)
}

// 路人背影（面向攤位挑東西）；bag 有顏色的話右手提一個購物袋
function makeNpcBack(colors) {
  const { buf, r } = sheet(24, 37)
  const R = (x, y, w, h, c) => r(x, y + 2, w, h, c)
  R(8, 28, 3, 2, '#3c4258'); R(13, 28, 3, 2, '#3c4258')
  R(7, 30, 4, 1, '#4a3c32'); R(13, 30, 4, 1, '#4a3c32')
  R(4, 19, 2, 7, colors.coat); R(18, 19, 2, 7, colors.coat)
  R(4, 26, 2, 1, '#f7d3b8'); R(18, 26, 2, 1, '#f7d3b8')
  R(6, 18, 12, 12, colors.coat)
  if (colors.skirt) R(6, 23, 12, 8, colors.skirt)
  R(6, 7, 12, 10, colors.hair)              // 後腦勺
  R(5, 2, 14, 6, colors.hair); R(4, 4, 2, 8, colors.hair); R(18, 4, 2, 8, colors.hair)
  R(5, 9, 1, 3, '#f7d3b8'); R(18, 9, 1, 3, '#f7d3b8') // 耳朵
  R(8, 16, 8, 2, '#f7d3b8')                            // 後頸
  if (colors.cap) { R(4, 1, 16, 3, colors.cap) }
  if (colors.bag) { R(19, 26, 1, 2, '#c8c8d0'); R(18, 28, 5, 6, colors.bag); R(18, 28, 5, 1, '#ffffff') }
  return outline(buf)
}

// 錢洗井：小小的屋頂＋石頭水盆＋竹籃
function makeWell() {
  const { buf, r } = sheet(28, 37)
  r(2, 6, 24, 4, '#4a4a58'); r(4, 4, 20, 2, '#5a5a68'); r(2, 6, 24, 1, '#6a6a78') // 屋頂
  r(4, 10, 2, 16, '#8a5a3a'); r(22, 10, 2, 16, '#8a5a3a')                       // 柱子
  r(10, 11, 8, 4, '#f3efe8'); r(11, 12, 6, 1, '#d84a3a')                         // 小匾額
  r(3, 24, 22, 10, '#9a9aa2'); r(3, 24, 22, 2, '#b8b8c0')                        // 石盆
  r(5, 26, 18, 3, '#5aa0d8'); r(7, 26, 6, 1, '#9fd8ff')                          // 水
  r(16, 20, 8, 4, '#c9a46a'); r(17, 21, 6, 2, '#a07a40'); r(19, 21, 2, 1, '#ffd166') // 竹籃＋硬幣
  return outline(buf)
}

// 籤：放籤的木架，上面綁滿白色的籤
function makeOmikuji() {
  const { buf, r } = sheet(24, 37)
  r(3, 12, 2, 24, '#7a5a3a'); r(19, 12, 2, 24, '#7a5a3a')
  r(1, 10, 22, 3, '#5a4030')
  ;[16, 21, 26].forEach((y) => {
    r(3, y, 18, 1, '#5a4030')
    for (let x = 4; x < 20; x += 3) { r(x, y - 2, 2, 2, '#ffffff'); r(x, y + 1, 2, 2, '#f3efe8') }
  })
  r(8, 30, 8, 6, '#d84a3a'); r(9, 31, 6, 1, '#f3efe8') // 籤筒
  return outline(buf)
}

// 繪馬架
function makeEma() {
  const { buf, r } = sheet(28, 37)
  r(2, 8, 2, 28, '#5a4030'); r(24, 8, 2, 28, '#5a4030')
  r(0, 6, 28, 3, '#4a4a58')
  ;[12, 20].forEach((y) => {
    r(2, y, 24, 1, '#5a4030')
    for (let x = 3; x < 24; x += 5) { r(x, y + 1, 4, 5, '#d8b880'); r(x + 1, y + 2, 2, 1, '#8a5a3a'); r(x, y + 1, 4, 1, '#c9a46a') }
  })
  return outline(buf)
}

// 長椅
function makeBench() {
  const { buf, r } = sheet(36, 37)
  r(3, 18, 30, 3, '#8a5a3a'); r(3, 22, 30, 3, '#8a5a3a') // 椅背
  r(2, 27, 32, 3, '#a06a40'); r(2, 27, 32, 1, '#c08a50') // 座位
  r(4, 18, 2, 18, '#2a2a38'); r(30, 18, 2, 18, '#2a2a38') // 鐵腳
  r(3, 33, 4, 3, '#2a2a38'); r(29, 33, 4, 3, '#2a2a38')
  return outline(buf)
}

// 熱飲小推車
function makeCart() {
  const { buf, r } = sheet(34, 37)
  for (let x = 1; x < 33; x += 4) r(x, 4, 4, 6, (x / 4) % 2 ? '#f3efe8' : '#c23b4a') // 條紋遮雨棚
  r(1, 10, 32, 1, '#8e1a2a')
  r(3, 11, 2, 10, '#c8c8d0'); r(29, 11, 2, 10, '#c8c8d0')
  r(2, 20, 30, 12, '#e8d4a8'); r(2, 20, 30, 2, '#f8e8c8')
  r(6, 23, 8, 6, '#ffd166'); r(18, 23, 10, 6, '#c23b4a'); r(20, 25, 6, 2, '#f3efe8') // 招牌
  r(6, 14, 5, 6, '#f3efe8'); r(13, 15, 5, 5, '#f3efe8'); r(7, 13, 3, 1, '#d8d0c0')  // 杯子
  r(5, 32, 5, 5, '#2a2a38'); r(24, 32, 5, 5, '#2a2a38')                              // 輪子
  return outline(buf)
}

// pose：'front'（正面站著，不晃動）、'side'（側面走路，frame 0/1 交替）、'back'（背對鏡頭）
export function objectCanvas(obj, frame, pose = 'front') {
  // 用外觀（顏色組合）當快取的名字：不同區域可以有同 id 的人，不會互相蓋掉
  const look = obj.sprite === 'npc' ? JSON.stringify(obj.colors) : ''
  if (obj.sprite === 'npc' && pose === 'back') return cached(`npcb-${look}`, () => makeNpcBack(obj.colors))
  if (obj.sprite === 'npc' && pose === 'side') return cached(`npcs-${look}-${frame}`, () => makeNpcSide(obj.colors, frame))
  if (obj.sprite === 'npc') return cached(`npc-${look}`, () => makeNpc(obj.colors, 0))
  const MAKERS = { sign: makeSign, well: makeWell, omikuji: makeOmikuji, ema: makeEma, bench: makeBench, cart: makeCart }
  if (MAKERS[obj.sprite]) return cached(obj.sprite, MAKERS[obj.sprite])
  return null
}

// 主角：上 → 背面、左右 → 側面（往左時由畫面那邊翻轉）、下 → 正面
export function girlCanvas(facing, walking, frame) {
  const base = facing === 'up' ? 'back' : facing === 'left' || facing === 'right' ? 'side' : ''
  const pose = base ? `${base}-${walking ? 'walk' : 'idle'}` : (walking ? 'walk' : 'idle')
  return cached(`girl-${pose}-${frame}`, () => drawGirl(pose, frame))
}

// 指定姿勢：女生 'surprise'，男生 'idle' / 'kneel' / 'side-walk' / 'side-idle'
export function girlPoseCanvas(pose, frame = 0) {
  return cached(`girl-${pose}-${frame}`, () => drawGirl(pose, frame))
}
export function boyCanvas(pose, frame = 0) {
  return cached(`boy-${pose}-${frame}`, () => drawBoy(pose, frame))
}

// ---------- 道具圖 ----------
// 牛奶糖：粉白配色的長條糖盒（不畫品牌標誌，只取配色的感覺）
function makeMilkCandy() {
  const { buf, r } = sheet(34, 12)
  r(1, 2, 32, 9, '#fbf7ee')            // 盒身
  r(1, 2, 32, 1, '#ffffff')
  r(1, 10, 32, 1, '#d9cfc0')
  r(9, 2, 15, 9, '#f2b8c6')            // 中間粉紅色區塊
  r(10, 3, 13, 1, '#f7cfd9')
  r(11, 5, 3, 3, '#7a4a5a'); r(15, 5, 3, 3, '#7a4a5a'); r(19, 5, 3, 3, '#7a4a5a') // 像文字的方塊
  r(12, 9, 9, 1, '#b07a8a')
  r(26, 4, 5, 5, '#e8e0d0'); r(27, 5, 3, 3, '#3a3a48') // 右邊的數字區
  r(3, 4, 4, 1, '#c96a80'); r(3, 6, 3, 1, '#c96a80')  // 左邊小字
  r(0, 3, 1, 7, '#e8e0d0'); r(33, 3, 1, 7, '#e8e0d0')  // 盒子兩端
  return outline(buf)
}

// 大吉以外的籤：一樣的籤紙，中間畫一個紅色的小印
function makeFortunePlain() {
  const { buf, r } = sheet(20, 30)
  r(2, 1, 16, 28, '#fbf7ee'); r(2, 1, 16, 2, '#d84a3a'); r(2, 27, 16, 2, '#d84a3a')
  r(3, 4, 14, 1, '#e8e0d0')
  r(7, 8, 6, 6, '#c8283a'); r(8, 9, 4, 4, '#fbf7ee'); r(9, 10, 2, 2, '#c8283a')
  for (let y = 17; y < 26; y += 2) r(5, y, 10, 1, '#b8b0a0')
  return outline(buf)
}

// 籤：白色籤紙，紅色「大吉」
function makeFortune() {
  const { buf, r } = sheet(20, 30)
  r(2, 1, 16, 28, '#fbf7ee'); r(2, 1, 16, 2, '#d84a3a'); r(2, 27, 16, 2, '#d84a3a')
  r(3, 4, 14, 1, '#e8e0d0')
  const big = ['..#..', '#####', '..#..', '.#.#.', '#...#'] // 大
  const ji = ['..#..', '#####', '..#..', '#####', '#...#', '#####'] // 吉
  big.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') r(8 + x, 7 + y, 1, 1, '#c8283a') }))
  ji.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') r(8 + x, 14 + y, 1, 1, '#c8283a') }))
  for (let y = 22; y < 26; y += 2) r(5, y, 10, 1, '#b8b0a0')
  return outline(buf)
}

// 展望台門票（兩張疊在一起）
function makeTickets() {
  const { buf, r } = sheet(34, 18)
  r(6, 1, 26, 12, '#f3efe8'); r(6, 1, 26, 3, '#e8582a')
  r(2, 5, 26, 12, '#fbf7ee'); r(2, 5, 26, 3, '#e8582a')
  r(20, 9, 1, 7, '#c8c0b0') // 撕線
  r(9, 10, 1, 6, '#e8582a'); r(8, 12, 3, 1, '#e8582a'); r(7, 15, 5, 1, '#e8582a') // 小鐵塔
  r(22, 10, 4, 2, '#3a3a48'); r(22, 13, 3, 1, '#3a3a48')
  return outline(buf)
}

// 似顏繪：小畫框裡是兩個人
function makePortrait() {
  const { buf, r } = sheet(40, 36)
  r(0, 0, 40, 36, '#8a5a3a'); r(2, 2, 36, 32, '#fbf3e0')
  const put = (b, ox, oy) => b.pixels.forEach((c, i) => {
    if (!c) return
    const x = i % b.w, y = Math.floor(i / b.w)
    if (y % 2 === 0 && x % 2 === 0) r(ox + x / 2, oy + y / 2, 1, 1, c) // 縮小一半
  })
  put(drawBoy('idle', 0), 6, 10)
  put(drawGirl('idle', 0), 20, 10)
  r(17, 12, 2, 2, '#ff6f91'); r(16, 11, 1, 1, '#ff6f91'); r(19, 11, 1, 1, '#ff6f91')
  return buf
}

// 小鎮的星星（試玩版的道具）
function makeStar() {
  const { buf, r } = sheet(17, 17)
  const rows = [[8, 1], [8, 1], [7, 3], [7, 3], [0, 17], [1, 15], [3, 11], [4, 9], [4, 9], [3, 11], [3, 4, 10, 4], [2, 3, 12, 3], [2, 2, 13, 2]]
  rows.forEach((row, y) => {
    for (let k = 0; k < row.length; k += 2) r(row[k], y + 2, row[k + 1], 1, '#ffd166')
  })
  r(7, 7, 1, 2, '#2b2233'); r(10, 7, 1, 2, '#2b2233'); r(6, 9, 1, 1, '#ff9aa8'); r(11, 9, 1, 1, '#ff9aa8'); r(8, 10, 2, 1, '#c8564e')
  r(8, 3, 1, 2, '#fff2c8'); r(5, 6, 2, 1, '#fff2c8')
  return outline(buf)
}

const ITEMS = { star: makeStar, 'milk-candy': makeMilkCandy, fortune: makeFortune, 'fortune-plain': makeFortunePlain, tickets: makeTickets, portrait: makePortrait }

export function itemCanvas(id) {
  return ITEMS[id] ? cached(`item-${id}`, ITEMS[id]) : null
}

// 放大鏡
export function magnifierCanvas() {
  return cached('magnifier', () => {
    const { buf, r } = sheet(13, 13)
    r(3, 0, 5, 1, '#f3efe8'); r(1, 1, 2, 1, '#f3efe8'); r(8, 1, 2, 1, '#f3efe8')
    r(0, 3, 1, 5, '#f3efe8'); r(10, 3, 1, 5, '#f3efe8')
    r(1, 2, 1, 1, '#f3efe8'); r(9, 2, 1, 1, '#f3efe8'); r(1, 8, 1, 1, '#f3efe8'); r(9, 8, 1, 1, '#f3efe8')
    r(1, 9, 2, 1, '#f3efe8'); r(8, 9, 2, 1, '#f3efe8'); r(3, 10, 5, 1, '#f3efe8')
    r(1, 3, 9, 5, '#9fd8ff'); r(3, 1, 5, 9, '#9fd8ff'); r(2, 2, 7, 7, '#9fd8ff')
    r(3, 3, 2, 2, '#ffffff')
    r(9, 9, 2, 2, '#c9a46a'); r(10, 10, 2, 2, '#c9a46a'); r(11, 11, 2, 2, '#8a6a3a')
    return outline(buf)
  })
}

// 給橫向捲軸場景共用
export { px, hash, drawText, stallTable }
