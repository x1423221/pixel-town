// 阿美橫町：JR 高架＋山手線、高架下的店、攤位、入口拱門、上野站
//   0-1 夜空＋遠方大樓   2 高架上層（電車）   3 高架橋樑
//   4-5 高架下的店       6 攤位檯子           7-10 路面
import { TILE, drawTile, px, hash, drawText, stallTable, drawTrain, TRAIN_LENGTH } from '../sceneArt.js'
import { laneY, ground, gateGeom, pasteAlongBeam, offscreen, stars } from '../stage.js'
import { light, mix, skyBands, nightAlpha, glow } from '../daylight.js'

const STALL_FEET = 7 * TILE - 9 // 攤位裡的人腳底（下半身被櫃檯擋住）

// ---------- 天空與遠方大樓（視差：捲動比較慢）；天色跟著日本時間變 ----------
function sky(ctx, camX, viewW) {
  skyBands(ctx, viewW, 3 * TILE, 6)
  if (nightAlpha() > 0) { ctx.globalAlpha = nightAlpha(); stars(ctx, camX, viewW, 40, '#4a5490'); ctx.globalAlpha = 1 }
  skyline(ctx, camX, viewW, false)
}

// 遠方大樓：lit = false 畫大樓本身；lit = true 只畫亮著的窗戶和霓虹（天黑後疊在最上面）
function skyline(ctx, camX, viewW, lit) {
  const offset = camX * 0.4
  const start = Math.floor(offset / 14) - 1
  const d = light.dark
  for (let i = start; i < start + viewW / 14 + 3; i++) {
    const h = 26 + Math.floor(hash(i, 1) * 34)
    const x = i * 14 - offset
    const top = 3 * TILE - h
    if (!lit) px(ctx, x, top, 13, h, hash(i, 2) > 0.5 ? mix('#8a92b2', '#232a4a', d) : mix('#9a9cb6', '#1e2442', d))
    for (let wy = top + 4; wy < 3 * TILE - 4; wy += 6) {
      for (let wx = 2; wx < 12; wx += 4) {
        const on = hash(i * 13 + wx, wy) > 0.72
        if (lit && on) px(ctx, x + wx, wy, 2, 2, '#c9a44a')
        if (!lit) px(ctx, x + wx, wy, 2, 2, on && d > 0.5 ? '#c9a44a' : mix('#c4d0e2', '#2a3256', d))
      }
    }
    if (hash(i, 9) > 0.55) { // 直式霓虹招牌
      const neon = ['#ff4d6d', '#ffd166', '#ff8ad8', '#7ad7ff', '#ff7a3a'][Math.floor(hash(i, 4) * 5)]
      const sh = 14 + Math.floor(hash(i, 6) * 10)
      const sy = top + 3
      px(ctx, x + 9, sy, 4, sh, neon)
      for (let k = sy + 2; k < sy + sh - 1; k += 3) px(ctx, x + 10, k, 2, 1, '#fff6e0')
    }
  }
}

// 天黑後才畫：窗戶、霓虹重新亮起來
function lights(ctx, scene, clock, camX, viewW) {
  const a = nightAlpha()
  if (a <= 0) return
  ctx.globalAlpha = a
  skyline(ctx, camX, viewW, true)
  // 高架下的店、攤位上的燈泡串
  ctx.save()
  ctx.translate(-camX, 0)
  const x0 = Math.floor(camX / TILE), x1 = Math.min(scene.width, Math.ceil((camX + viewW) / TILE))
  for (let tx = x0; tx < x1; tx++) {
    const X = tx * TILE
    bulbString(ctx, X, 4 * TILE + 9, tx)
    if (scene.stalls[tx] && scene.stalls[tx] !== ',') bulbString(ctx, X, 6 * TILE, tx + 1)
  }
  ctx.globalAlpha = 1
  for (let tx = x0; tx < x1; tx++) {
    glow(ctx, tx * TILE + 12, 4 * TILE + 10, 16, '255, 230, 160', 0.7)
    if (scene.stalls[tx] && scene.stalls[tx] !== ',') glow(ctx, tx * TILE + 12, 6 * TILE + 2, 14, '255, 230, 160', 0.8)
  }
  ctx.restore()
}

// 一串燈泡
function bulbString(ctx, X, y, tx) {
  px(ctx, X, y, TILE, 1, '#3a2e2a')
  for (let bx = (tx % 2) * 2 + 1; bx < TILE; bx += 4) {
    px(ctx, X + bx, y + 1, 2, 2, '#fff2b0')
    px(ctx, X + bx, y + 1, 1, 1, '#ffffff')
  }
}

// 高架下那一排店的下半部
function shopLower(ctx, X, Y, tx) {
  px(ctx, X, Y, TILE, TILE, '#8a7a66')
  for (let sy = 2; sy < 16; sy += 5) px(ctx, X + 2, Y + sy, TILE - 4, 1, '#3a2e2a')
  for (let sx = 3; sx < TILE - 3; sx += 4) {
    px(ctx, X + sx, Y + 3, 2, 2, ['#ffd166', '#ff8a5a', '#7ad7ff', '#9adf7a'][(sx + tx) % 4])
    px(ctx, X + sx + 1, Y + 8, 2, 2, ['#c94a4a', '#f3efe8', '#ffd166'][(sx + tx) % 3])
  }
  px(ctx, X, Y + 16, TILE, 8, '#4a3a2e')
  if (tx % 2 === 0) { px(ctx, X, Y, 3, TILE, '#6b6f80'); px(ctx, X + 1, Y, 1, TILE, '#8a8e9c') } // 橋墩
}

// 後層：高架 → 店（攤販要站在這一層和櫃檯之間）
function back(ctx, tx) {
  const X = tx * TILE
  drawTile(ctx, 'V', tx, 2)
  drawTile(ctx, 'W', tx, 3)
  px(ctx, X, 3 * TILE, TILE, 7, '#7a2a2e') // 高架側面的暗紅色欄杆
  px(ctx, X, 3 * TILE, TILE, 1, '#a8444a')
  for (let bx = 1; bx < TILE; bx += 3) px(ctx, X + bx, 3 * TILE + 2, 1, 4, '#4a1a1e')
  drawTile(ctx, 'U', tx, 4)
  bulbString(ctx, X, 4 * TILE + 9, tx)
  shopLower(ctx, X, 5 * TILE, tx)
  px(ctx, X, 6 * TILE, TILE, TILE, '#3a2e2a') // 攤位後方的店內陰影
}

// 前層：攤位櫃檯 → 路面
//   A 零食／乾貨／衣服隨機   F 水果   K 魚   C 牛奶糖   , 沒有攤位
function front(ctx, tx, scene) {
  const X = tx * TILE
  const ch = scene.stalls[tx]
  if (ch && ch !== ',') {
    const kind = { F: 'fruit', K: 'fish', C: 'candy' }[ch] ||
      ['snack', 'dried', 'clothes', 'snack'][Math.floor(hash(tx, 18) * 4)]
    stallTable(ctx, X, 6 * TILE, kind, tx, 6, false)
    bulbString(ctx, X, 6 * TILE, tx + 1)
  } else {
    px(ctx, X, 6 * TILE + 14, TILE, 10, '#5a4030')
    px(ctx, X, 6 * TILE + 14, TILE, 1, '#7a5a40')
  }
  ground(ctx, tx, { base: '#7a7486', edge: '#5a5468', line: '#6a6478', curb: '#4a4458', curbHi: '#9a94a6' })
}

// 山手線＋上野站
function extras(ctx, scene, clock, worldW) {
  if (scene.train) {
    const { cars, everyMs } = scene.train
    const len = TRAIN_LENGTH(cars)
    const travel = worldW + len
    const runMs = (travel / 140) * 1000
    const cycle = runMs + everyMs
    const t = clock % cycle
    if (t < runMs) {
      const right = Math.floor(clock / cycle) % 2 === 0
      const d = (t / runMs) * travel
      drawTrain(ctx, Math.round(right ? d - len : worldW - d), 2 * TILE, cars, right)
    }
  }
  if (scene.station) drawStation(ctx, scene.station.x)
}

function drawStation(ctx, tx) {
  const X = tx * TILE, W = 3 * TILE
  const top = 1 * TILE
  const bottom = laneY(0)
  px(ctx, X, top, W, bottom - top, '#c8b89a')
  px(ctx, X, top, W, 4, '#e0d4bc')
  px(ctx, X - 2, top - 4, W + 4, 5, '#8a7a5e')
  px(ctx, X + 10, top + 10, 46, 20, '#1b2a4a')
  px(ctx, X + 10, top + 10, 46, 1, '#4a5a7a')
  drawText(ctx, '上野', X + 20, top + 15, '#f3efe8')
  for (let wx = 6; wx < W - 8; wx += 16) {
    px(ctx, X + wx, top + 40, 10, 16, '#5a6a8a')
    px(ctx, X + wx + 1, top + 41, 8, 6, '#ffd166')
    px(ctx, X + wx, top + 72, 10, 16, '#5a6a8a')
    px(ctx, X + wx + 1, top + 73, 8, 6, '#9fd8ff')
  }
  const doorY = bottom - 44
  px(ctx, X + 12, doorY, 40, 44, '#1b1e30')
  px(ctx, X + 14, doorY + 3, 17, 41, '#3a4a6a'); px(ctx, X + 33, doorY + 3, 17, 41, '#3a4a6a')
  px(ctx, X + 16, doorY + 5, 6, 14, '#9fd8ff'); px(ctx, X + 35, doorY + 5, 6, 14, '#9fd8ff')
  px(ctx, X + 10, doorY - 4, 44, 4, '#8a7a5e')
}

// ---------- 入口拱門：鐵灰色柱子＋斜的橫樑＋「アメ横」招牌 ----------
const ARCH_H = 100

function disc(ctx, cx, cy, ch) {
  const ring = [[-5, -10, 10, 1], [-8, -9, 16, 1], [-9, -8, 18, 2], [-10, -6, 20, 12], [-9, 6, 18, 2], [-8, 8, 16, 1], [-5, 9, 10, 1]]
  ring.forEach(([x, y, w, h]) => px(ctx, cx + x, cy + y, w, h, '#2e6ad0'))
  const face = [[-4, -8, 8, 1], [-6, -7, 12, 1], [-7, -6, 14, 2], [-8, -4, 16, 8], [-7, 4, 14, 2], [-6, 6, 12, 1], [-4, 7, 8, 1]]
  face.forEach(([x, y, w, h]) => px(ctx, cx + x, cy + y, w, h, '#fbf7ee'))
  const w = ch === '横' ? 11 : 9
  drawText(ctx, ch, cx - Math.floor(w / 2), cy - 6, '#d8283a')
}

const SIGN_BASE = 40 // 招牌圖裡橫樑的位置
let signImg = null
function sign() {
  if (signImg) return signImg
  signImg = offscreen(92, 52, (ctx) => {
    const sx = 46, cy = SIGN_BASE - 13
    const wing = (dir) => {
      for (let i = 0; i < 10; i++) {
        const x = dir < 0 ? sx - 34 - i : sx + 33 + i
        px(ctx, x, cy - 6 + Math.floor(i / 3), 2, 12 - Math.floor(i / 2), '#2a52a8')
      }
      const x0 = dir < 0 ? sx - 44 : sx + 33
      px(ctx, x0, cy - 7, 12, 2, '#ffd166')
      for (let k = 0; k < 12; k += 3) px(ctx, x0 + k, cy - 8, 1, 1, '#fff6c8')
    }
    wing(-1); wing(1)
    px(ctx, sx - 34, cy - 9, 68, 18, '#c8ccd4')
    px(ctx, sx - 34, cy - 9, 68, 1, '#e8ecf4')
    px(ctx, sx - 34, cy + 8, 68, 1, '#7a7e8c')
    for (let k = 0; k < 68; k += 4) px(ctx, sx - 33 + k, cy - 11, 2, 1, '#ffd166')
    px(ctx, sx - 30, cy + 9, 3, SIGN_BASE - cy - 9, '#7a7e8c'); px(ctx, sx + 27, cy + 9, 3, SIGN_BASE - cy - 9, '#7a7e8c')
    disc(ctx, sx - 22, cy, 'ア')
    disc(ctx, sx, cy, 'メ')
    disc(ctx, sx + 22, cy, '横')
    const ty = cy - 21 // 時鐘
    px(ctx, sx - 1, ty + 6, 2, 5, '#7a7e8c')
    ;[[-3, -6, 6, 1], [-5, -5, 10, 1], [-6, -4, 12, 8], [-5, 4, 10, 1], [-3, 5, 6, 1]].forEach(([x, y, w, h]) => px(ctx, sx + x, ty + y, w, h, '#2e6ad0'))
    ;[[-3, -4, 6, 1], [-4, -3, 8, 6], [-3, 3, 6, 1]].forEach(([x, y, w, h]) => px(ctx, sx + x, ty + y, w, h, '#f3f6ff'))
    px(ctx, sx, ty - 2, 1, 3, '#1b1e30'); px(ctx, sx, ty, 3, 1, '#1b1e30')
    px(ctx, sx - 30, SIGN_BASE + 7, 60, 5, '#f2a2b8') // 粉紅布條
    px(ctx, sx - 30, SIGN_BASE + 7, 60, 1, '#ffd0dc')
    for (let k = 3; k < 58; k += 6) px(ctx, sx - 30 + k, SIGN_BASE + 9, 3, 1, '#a8344a')
  })
  return signImg
}

function pillar(ctx, p) {
  const top = p.foot - ARCH_H
  px(ctx, p.x, top, 8, ARCH_H, '#8a8e9c')
  px(ctx, p.x + 1, top, 2, ARCH_H, '#c8ccd4')
  px(ctx, p.x + 7, top, 1, ARCH_H, '#5a5e6e')
  px(ctx, p.x - 2, p.foot - 4, 12, 5, '#5a5e6e')
}

function obstacles(scene) {
  if (!scene.arch) return []
  const g = gateGeom(scene.arch.x * TILE, ARCH_H)
  return [g.back, g.front].map((p) => ({ ...p, w: g.w, draw: (ctx) => pillar(ctx, p) }))
}

function overlay(ctx, scene) {
  if (!scene.arch) return
  const g = gateGeom(scene.arch.x * TILE, ARCH_H)
  for (let x = g.x0; x <= g.x1; x++) { // 斜的橫樑
    const y = Math.round(g.beamAt(x)) - 3
    px(ctx, x, y, 1, 7, '#7a7e8c')
    px(ctx, x, y, 1, 1, '#e8ecf4')
    if ((x - g.x0) % 5 === 2) px(ctx, x, y + 3, 1, 1, '#ffd166')
  }
  pasteAlongBeam(ctx, g, sign(), SIGN_BASE)
}

export default { sky, back, front, extras, obstacles, overlay, lights, stallFeet: STALL_FEET }
