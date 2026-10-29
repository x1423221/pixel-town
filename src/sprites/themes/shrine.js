// 小網神社：早上的藍天、後面的辦公大樓、白牆＋神社樹林、授與所、鳥居、正殿
//   0-3 天空＋大樓   4 樹林   5-6 白牆／授與所   7-10 碎石＋石板參道
import { TILE, px, hash } from '../sceneArt.js'
import { laneY, ground, gateGeom, pasteAlongBeam, offscreen, stars } from '../stage.js'
import { light, mix, skyBands, nightAlpha, glow } from '../daylight.js'

const BOOTH_FEET = 7 * TILE - 9 // 授與所裡巫女的腳底

// ---------- 天空、雲、遠方辦公大樓 ----------
function sky(ctx, camX, viewW) {
  const d = light.dark
  skyBands(ctx, viewW, 4 * TILE, 6)
  if (nightAlpha() > 0) { ctx.globalAlpha = nightAlpha(); stars(ctx, camX, viewW, 50, '#4a5490'); ctx.globalAlpha = 1 }
  // 雲（很慢；天黑後變暗）
  const cloud = mix('#ffffff', '#3a4068', d), cloudShade = mix('#e4f2fa', '#2e3458', d)
  for (let i = 0; i < 5; i++) {
    const cx = ((Math.floor(hash(i, 2) * 500) - camX * 0.08) % (viewW + 60) + viewW + 60) % (viewW + 60) - 30
    const cy = 10 + Math.floor(hash(i, 4) * 30)
    px(ctx, cx, cy, 22, 4, cloud); px(ctx, cx + 4, cy - 3, 12, 3, cloud); px(ctx, cx + 2, cy + 4, 18, 1, cloudShade)
  }
  offices(ctx, camX, viewW, false)
}

// 辦公大樓（視差）：lit = true 只畫天黑後亮著的窗戶
function offices(ctx, camX, viewW, lit) {
  const d = light.dark
  const offset = camX * 0.4
  const start = Math.floor(offset / 18) - 1
  for (let i = start; i < start + viewW / 18 + 3; i++) {
    const h = 44 + Math.floor(hash(i, 1) * 50)
    const x = i * 18 - offset
    const top = 4 * TILE - h
    const glass = hash(i, 2) > 0.5
    if (!lit) {
      px(ctx, x, top, 17, h, mix(glass ? '#7a9ab8' : '#a8a8b0', glass ? '#1e2848' : '#262838', d))
      px(ctx, x, top, 17, 2, mix(glass ? '#9ab8d0' : '#c4c4cc', '#30344e', d))
    }
    for (let wy = top + 5; wy < 4 * TILE - 2; wy += 5) {
      for (let wx = 2; wx < 15; wx += 4) {
        const on = hash(i * 7 + wx, wy) > 0.55
        if (lit) { if (on) px(ctx, x + wx, wy, 2, 2, '#ffd98a'); continue }
        px(ctx, x + wx, wy, 2, 2, mix(glass ? '#c8e0f0' : '#7a8a9c', '#2a3048', d))
      }
    }
  }
}

// 天黑後：大樓的窗戶、石燈籠亮起來
function lights(ctx, scene, clock, camX, viewW) {
  const a = nightAlpha()
  if (a <= 0) return
  ctx.globalAlpha = a
  offices(ctx, camX, viewW, true)
  ctx.globalAlpha = 1
  ctx.save()
  ctx.translate(-camX, 0)
  ;[...scene.stalls].forEach((ch, tx) => {
    if (ch !== 'L') return
    const bx = tx * TILE + 6, top = 5 * TILE + 8
    ctx.globalAlpha = a
    px(ctx, bx + 4, top + 8, 4, 4, '#ffd88a')
    ctx.globalAlpha = 1
    glow(ctx, bx + 6, top + 10, 14)
  })
  ctx.restore()
}

// ---------- 後層 ----------
//   B 授與所（巫女站在裡面）、L 石燈籠、N 紅白旗、, 白牆
function back(ctx, tx, scene) {
  const X = tx * TILE
  const ch = scene.stalls[tx]
  // 神社樹林
  px(ctx, X, 3 * TILE + 12, TILE, 2 * TILE - 12, '#2f5a3a')
  for (let i = 0; i < 4; i++) {
    const bx = X + Math.floor(hash(tx, i) * 20) - 4
    const by = 3 * TILE + 2 + Math.floor(hash(tx, i + 9) * 14)
    px(ctx, bx, by, 14, 10, '#3d6e48'); px(ctx, bx + 3, by - 3, 8, 3, '#3d6e48'); px(ctx, bx + 2, by + 1, 4, 2, '#5a9060')
  }

  if (ch === 'B') { // 授與所：木造小屋，裡面掛著御守
    px(ctx, X, 4 * TILE + 6, TILE, 2 * TILE - 6 + TILE, '#6a4a32')
    px(ctx, X - 1, 4 * TILE + 2, TILE + 2, 6, '#4a4a58') // 屋簷
    px(ctx, X - 1, 4 * TILE + 2, TILE + 2, 1, '#6a6a78')
    px(ctx, X + 2, 4 * TILE + 12, TILE - 4, 2 * TILE - 12, '#f3ead8') // 店內（白色布幕）
    for (let sx = 4; sx < TILE - 4; sx += 4) { // 御守
      px(ctx, X + sx, 5 * TILE + 4, 2, 4, ['#d84a3a', '#2e6ad0', '#e0a020', '#e58fa6', '#2f8a5a'][(sx + tx) % 5])
      px(ctx, X + sx, 5 * TILE + 13, 2, 4, ['#2f8a5a', '#d84a3a', '#e58fa6', '#2e6ad0', '#e0a020'][(sx + tx) % 5])
    }
    px(ctx, X + 2, 6 * TILE, TILE - 4, TILE, '#4a3424') // 巫女背後
    return
  }

  // 白牆（瓦片屋頂＋木頭腰板）
  px(ctx, X, 5 * TILE - 2, TILE, 6, '#4a4a58')
  px(ctx, X, 5 * TILE - 2, TILE, 1, '#6a6a78')
  for (let sx = 0; sx < TILE; sx += 3) px(ctx, X + sx, 5 * TILE + 2, 2, 2, '#3a3a48')
  px(ctx, X, 5 * TILE + 4, TILE, 2 * TILE - 4, '#f3efe4')
  px(ctx, X, 6 * TILE + 12, TILE, 12, '#7a5a3a')
  px(ctx, X, 6 * TILE + 12, TILE, 1, '#9a7a52')
  if (tx % 4 === 0) px(ctx, X, 5 * TILE + 4, 2, 2 * TILE - 4, '#d8d2c4') // 牆柱

  if (ch === 'N') { // 紅白旗（のぼり）
    px(ctx, X + 10, 4 * TILE, 1, 3 * TILE, '#5a4030')
    px(ctx, X + 11, 4 * TILE + 4, 7, 40, '#d84a3a')
    px(ctx, X + 11, 4 * TILE + 4, 7, 3, '#f3efe8')
    for (let y = 4 * TILE + 12; y < 4 * TILE + 40; y += 6) px(ctx, X + 13, y, 3, 3, '#f3efe8')
  }
  if (ch === 'L') { // 石燈籠
    const bx = X + 6, top = 5 * TILE + 8
    px(ctx, bx + 2, top, 8, 3, '#8a8a90')     // 寶珠＋笠
    px(ctx, bx, top + 3, 12, 3, '#9a9aa2')
    px(ctx, bx + 2, top + 6, 8, 8, '#a8a8b0') // 火袋
    px(ctx, bx + 4, top + 8, 4, 4, '#ffd88a')
    px(ctx, bx + 1, top + 14, 10, 2, '#8a8a90')
    px(ctx, bx + 4, top + 16, 4, 20, '#9a9aa2') // 竿
    px(ctx, bx + 1, top + 36, 10, 4, '#8a8a90')
  }
}

// ---------- 前層：授與所的櫃檯、碎石地＋石板參道 ----------
function front(ctx, tx, scene) {
  const X = tx * TILE
  if (scene.stalls[tx] === 'B') {
    px(ctx, X, 6 * TILE + 8, TILE, 16, '#8a5a3a')
    px(ctx, X, 6 * TILE + 8, TILE, 2, '#b07a4a')
    for (let sx = 3; sx < TILE - 3; sx += 6) { // 櫃檯上的籤筒、繪馬
      px(ctx, X + sx, 6 * TILE + 3, 4, 5, ['#f3efe8', '#c9a46a'][(sx + tx) % 2])
      px(ctx, X + sx, 6 * TILE + 3, 4, 1, '#d84a3a')
    }
  }
  ground(ctx, tx, {
    base: '#cfc8b8', edge: '#a8a090', curb: '#8a8478', curbHi: '#e0dacb',
    dots: ['#b8b0a0', '#e0dacb', '#a8a090'],
  })
  // 石板參道（第 1～3 排）
  const top = laneY(1) - 14, h = laneY(3) - laneY(1) + 16
  px(ctx, X, top, TILE, h, '#b4b0a6')
  for (let y = top; y < top + h; y += 9) {
    px(ctx, X, y, TILE, 1, '#98948a')
    px(ctx, X + ((y / 9) % 2 ? 4 : 16), y, 1, 9, '#98948a')
  }
  px(ctx, X, top, TILE, 1, '#d8d4ca'); px(ctx, X, top + h, TILE, 1, '#98948a')
}

// ---------- 正殿（最右邊，走到前面就是終點） ----------
function extras(ctx, scene) {
  if (!scene.hall) return
  const X = scene.hall.x * TILE, W = 4 * TILE
  const bottom = laneY(0)
  // 石階＋基座
  px(ctx, X - 6, bottom - 12, W + 12, 12, '#a8a8b0')
  px(ctx, X - 6, bottom - 12, W + 12, 1, '#c8c8d0')
  px(ctx, X - 2, bottom - 18, W + 4, 6, '#9a9aa2')
  // 牆和柱子
  const wallTop = 2 * TILE + 20
  px(ctx, X + 4, wallTop, W - 8, bottom - 18 - wallTop, '#8a5a3a')
  ;[4, 26, W - 32, W - 10].forEach((c) => px(ctx, X + c, wallTop, 6, bottom - 18 - wallTop, '#d8452e'))
  px(ctx, X + 34, wallTop + 14, W - 68, bottom - 32 - wallTop, '#3a2418') // 深處
  px(ctx, X + 36, wallTop + 16, W - 72, 6, '#c9a44a')                    // 金色裝飾
  // 屋頂（深灰銅瓦，兩端翹起）
  const roofY = wallTop - 26
  for (let i = 0; i < 26; i++) {
    const inset = Math.max(0, 14 - Math.floor(i * 0.9))
    px(ctx, X - 14 + inset, roofY + i, W + 28 - inset * 2, 1, i < 3 ? '#5a6a6a' : '#3e4a4c')
  }
  px(ctx, X - 18, roofY + 22, 8, 4, '#3e4a4c'); px(ctx, X + W + 10, roofY + 22, 8, 4, '#3e4a4c')
  px(ctx, X - 20, roofY + 20, 4, 3, '#3e4a4c'); px(ctx, X + W + 16, roofY + 20, 4, 3, '#3e4a4c')
  px(ctx, X + W / 2 - 20, roofY - 3, 40, 3, '#c9a44a') // 屋脊金飾
  px(ctx, X + W / 2 - 2, roofY - 8, 4, 5, '#c9a44a')
  // 注連繩＋紙垂
  px(ctx, X + 10, wallTop + 4, W - 20, 4, '#e0c890')
  for (let sx = 18; sx < W - 18; sx += 14) {
    px(ctx, X + sx, wallTop + 8, 3, 3, '#ffffff'); px(ctx, X + sx + 1, wallTop + 11, 3, 3, '#ffffff'); px(ctx, X + sx, wallTop + 14, 3, 3, '#ffffff')
  }
  // 鈴＋鈴緒（紅白繩）
  const cx = X + W / 2
  px(ctx, cx - 4, wallTop + 8, 8, 7, '#c9a44a')
  px(ctx, cx - 2, wallTop + 15, 4, 34, '#d84a3a')
  for (let y = wallTop + 17; y < wallTop + 49; y += 4) px(ctx, cx - 2, y, 4, 2, '#f3efe8')
  // 賽錢箱
  px(ctx, cx - 16, bottom - 32, 32, 14, '#6a4428')
  px(ctx, cx - 16, bottom - 32, 32, 2, '#9a6a3a')
  for (let sx = -14; sx < 14; sx += 4) px(ctx, cx + sx, bottom - 30, 2, 4, '#3a2418')
}

// ---------- 鳥居（跟阿美橫町拱門一樣橫跨整條街） ----------
const TORII_H = 96
const TOP_BASE = 16 // 鳥居上半部圖裡，柱子頂端的位置

let toriiTop = null
function toriiSprite() {
  if (toriiTop) return toriiTop
  toriiTop = offscreen(158, 34, (ctx) => {
    const W = 158, mid = W / 2
    // 笠木（黑色、兩端翹起）
    px(ctx, 6, 4, W - 12, 6, '#2b2233')
    px(ctx, 6, 4, W - 12, 1, '#4a4458')
    px(ctx, 0, 1, 10, 6, '#2b2233'); px(ctx, W - 10, 1, 10, 6, '#2b2233')
    px(ctx, 0, 0, 5, 3, '#2b2233'); px(ctx, W - 5, 0, 5, 3, '#2b2233')
    // 島木（紅）
    px(ctx, 10, 10, W - 20, 5, '#d8452e')
    px(ctx, 10, 14, W - 20, 1, '#9a2a1e')
    // 額束＋扁額
    px(ctx, mid - 4, 15, 8, 13, '#d8452e')
    px(ctx, mid - 7, 16, 14, 10, '#2b2233')
    px(ctx, mid - 5, 18, 10, 6, '#c9a44a')
    // 貫（紅，比較短）
    px(ctx, 14, 26, W - 28, 5, '#d8452e')
    px(ctx, 14, 26, W - 28, 1, '#f07a5a')
    px(ctx, 14, 30, W - 28, 1, '#9a2a1e')
  })
  return toriiTop
}

function pillar(ctx, p) {
  const top = p.foot - TORII_H
  px(ctx, p.x, top, 8, TORII_H, '#d8452e')
  px(ctx, p.x + 1, top, 2, TORII_H, '#f07a5a')
  px(ctx, p.x + 7, top, 1, TORII_H, '#9a2a1e')
  px(ctx, p.x - 1, p.foot - 8, 10, 8, '#2b2233') // 根卷（黑色）
}

function obstacles(scene) {
  if (!scene.torii) return []
  const g = gateGeom(scene.torii.x * TILE, TORII_H)
  return [g.back, g.front].map((p) => ({ ...p, w: g.w, draw: (ctx) => pillar(ctx, p) }))
}

function overlay(ctx, scene) {
  if (!scene.torii) return
  const g = gateGeom(scene.torii.x * TILE, TORII_H)
  pasteAlongBeam(ctx, g, toriiSprite(), TOP_BASE)
}

export default { sky, back, front, extras, obstacles, overlay, lights, stallFeet: BOOTH_FEET }
