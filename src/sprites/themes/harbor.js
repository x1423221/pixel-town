// 海洋（最終章）：夜晚的港口。原創的港邊小鎮、燈塔、水面倒影、石欄杆、路燈、聖誕樹
// 煙火畫在 sky 之後、far 之前，所以會出現在遠方建築的後面
//   0-3 夜空（煙火）＋對岸小鎮   3-6 海面＋小船   6 石欄杆   7-10 石板步道
import { TILE, px, hash } from '../sceneArt.js'
import { laneY, ground, stars } from '../stage.js'
import { light, mix, skyBands, nightAlpha, glow } from '../daylight.js'

function sky(ctx, camX, viewW) {
  skyBands(ctx, viewW, 4 * TILE, 6)
  if (nightAlpha() > 0) { ctx.globalAlpha = nightAlpha(); stars(ctx, camX, viewW, 70, '#5a64a8'); ctx.globalAlpha = 1 }
}

// 對岸：起伏的小山＋暖色窗戶的小房子＋會閃的燈塔（視差）
function far(ctx, camX, viewW, clock) {
  farTown(ctx, camX, viewW, clock, false)
}

// 對岸的小鎮：lit = true 只畫天黑後亮著的窗戶和燈塔的燈
function farTown(ctx, camX, viewW, clock, lit) {
  const d = light.dark
  const off = camX * 0.35
  const base = 3 * TILE + 14
  if (!lit) {
    const hill = mix('#5a7a7a', '#232a4e', d)
    for (let x = 0; x < viewW; x++) {
      const wx = x + off
      const h = 10 + Math.round(Math.sin(wx / 37) * 6 + Math.sin(wx / 13) * 3)
      px(ctx, x, base - h, 1, h, hill)
    }
  }
  for (let i = Math.floor(off / 16) - 1; i < off / 16 + viewW / 16 + 2; i++) {
    const x = i * 16 - off + Math.floor(hash(i, 1) * 6)
    const h = 10 + Math.floor(hash(i, 2) * 12)
    if (!lit) {
      const c = [['#e8d8c0', '#3a3460'], ['#d8c8b8', '#40385e'], ['#f0e4d0', '#34305a']][((i % 3) + 3) % 3]
      px(ctx, x, base - h, 12, h, mix(c[0], c[1], d))
      px(ctx, x - 1, base - h - 3, 14, 3, mix('#c25a4a', '#2a2650', d)) // 屋頂
    }
    for (let wy = base - h + 3; wy < base - 2; wy += 5) {
      const col = lit ? '#ffcf7a' : mix('#7a9ab8', '#3a3a62', d)
      if (hash(i, wy) > 0.35) px(ctx, x + 2, wy, 2, 3, col)
      if (hash(i + 7, wy) > 0.45) px(ctx, x + 7, wy, 2, 3, col)
    }
  }
  // 燈塔（燈只有天黑才閃）
  const lx = Math.round(150 - off * 0.5)
  if (!lit) {
    px(ctx, lx, base - 34, 6, 30, '#e8e0d0')
    px(ctx, lx, base - 26, 6, 4, '#c23b4a'); px(ctx, lx, base - 16, 6, 4, '#c23b4a')
    px(ctx, lx - 1, base - 38, 8, 4, mix('#5a5a6a', '#2a2650', d))
  } else if (Math.floor(clock / 900) % 2 === 0) {
    px(ctx, lx + 1, base - 37, 4, 3, '#fff2b0')
    glow(ctx, lx + 3, base - 36, 10, '255, 242, 176')
  }
}

// ---------- 後層：海面、倒影、石欄杆、路燈（S）、彩燈 ----------
function back(ctx, tx, scene, clock) {
  const X = tx * TILE
  const top = 3 * TILE + 14
  const d = light.dark
  px(ctx, X, top, TILE, 6 * TILE + 12 - top, mix('#3a7ab8', '#1c2c5a', d))
  // 波光（會閃；白天是白色反光，晚上是燈光倒影）
  for (let i = 0; i < 6; i++) {
    const y = top + 4 + Math.floor(hash(tx, i) * 50)
    const shift = Math.floor((clock / 300 + i + tx) % 4)
    px(ctx, X + Math.floor(hash(tx, i + 9) * 18) + shift, y, 4, 1, i % 2 ? mix('#7ab0e0', '#3a5a9a', d) : mix('#e8f4ff', '#ffcf7a', d))
  }
  // 石欄杆
  const ry = 6 * TILE + 4
  px(ctx, X, ry, TILE, 4, '#d8c8a8')
  px(ctx, X, ry, TILE, 1, '#efe2c4')
  for (let sx = 2; sx < TILE; sx += 6) {
    px(ctx, X + sx, ry + 4, 3, 14, '#c8b898')
    px(ctx, X + sx, ry + 8, 3, 2, '#d8c8a8')
  }
  px(ctx, X, ry + 18, TILE, 2, '#a8987a')
  // 路燈＋燈與燈之間的彩燈
  if (scene.stalls[tx] === 'S') {
    px(ctx, X + 11, 3 * TILE + 6, 2, 4 * TILE - 6, '#2a2a38')
    px(ctx, X + 7, 3 * TILE - 2, 10, 9, '#2a2a38')
    px(ctx, X + 8, 3 * TILE, 8, 6, '#ffe2a0')
    px(ctx, X + 4, 3 * TILE + 8, 16, 1, '#2a2a38')
    px(ctx, X + 9, 7 * TILE - 2, 6, 2, '#2a2a38')
  }
  stringLights(ctx, tx, clock, false)
}

// 燈與燈之間垂下來的彩燈；bulbsOnly 只畫燈泡（天黑後疊在最上面）
function stringLights(ctx, tx, clock, bulbsOnly) {
  const X = tx * TILE
  const sag = (u) => Math.round(Math.sin(u * Math.PI) * 6) // 彩燈垂下來的弧度
  for (let sx = 0; sx < TILE; sx += 3) {
    const u = ((tx % 5) * TILE + sx) / (5 * TILE)
    const y = 3 * TILE + 4 + sag(u)
    if (!bulbsOnly) px(ctx, X + sx, y, 1, 1, '#4a4a5a')
    if (sx % 6 === 0) px(ctx, X + sx, y + 1, 2, 2, ['#ff6f91', '#ffd166', '#7ad7ff', '#9adf7a'][(tx + sx / 6 + Math.floor(clock / 500)) % 4])
  }
}

function front(ctx, tx) {
  const X = tx * TILE
  ground(ctx, tx, { base: '#8a7a6a', edge: '#5a4e44', curb: '#5a4e44', curbHi: '#b0a08a' })
  // 石板（交錯的小方塊）
  for (let row = 0; row < 5; row++) {
    const y = laneY(row) - 14
    px(ctx, X, y, TILE, 1, '#76685a')
    for (let sx = (row % 2) * 6; sx < TILE; sx += 12) px(ctx, X + sx, y, 1, 18, '#76685a')
  }
}

// ---------- 小船、聖誕樹、碼頭最前端的觀景台 ----------
function extras(ctx, scene, clock, worldW) {
  // 小帆船（慢慢漂）
  const bx = Math.round(((clock / 1000) * 6) % (worldW + 80)) - 40
  const by = 5 * TILE + 4 + Math.round(Math.sin(clock / 600) * 1)
  px(ctx, bx, by, 22, 4, '#e8e0d0'); px(ctx, bx + 2, by + 4, 18, 2, '#a8987a')
  px(ctx, bx + 10, by - 20, 1, 20, '#5a4e44')
  px(ctx, bx + 11, by - 18, 8, 14, '#f3efe8'); px(ctx, bx + 3, by - 14, 7, 10, '#e8e0d0')
  px(ctx, bx + 12, by - 2, 2, 1, '#ffcf7a')

  // 聖誕樹（原創、一般的樹）
  if (scene.tree) {
    const cx = scene.tree.x * TILE, foot = laneY(0) - 2
    px(ctx, cx - 4, foot - 12, 8, 12, '#5a4030')
    for (let i = 0; i < 5; i++) {
      const w = 54 - i * 10, y = foot - 18 - i * 16
      for (let r = 0; r < 18; r++) {
        const ww = Math.round(w * (r / 18))
        px(ctx, cx - ww / 2, y - 18 + r, ww, 1, r % 4 === 0 ? '#2a6a3a' : '#2f7a42')
      }
    }
    treeLights(ctx, scene, clock)
  }

  // 碼頭最前端：觀景台的燈＋看板
  if (scene.viewpoint) {
    const X = scene.viewpoint.x * TILE
    px(ctx, X, laneY(0) - 50, 3, 50, '#2a2a38')
    px(ctx, X - 4, laneY(0) - 58, 11, 9, '#2a2a38')
    px(ctx, X - 2, laneY(0) - 56, 7, 5, '#ffe2a0')
    px(ctx, X + 8, laneY(0) - 30, 26, 14, '#5a4030')
    px(ctx, X + 10, laneY(0) - 28, 22, 10, '#e8dcc0')
    px(ctx, X + 13, laneY(0) - 25, 16, 1, '#5a4030'); px(ctx, X + 13, laneY(0) - 22, 10, 1, '#5a4030')
    px(ctx, X + 20, laneY(0) - 16, 2, 16, '#5a4030')
  }
}

// 聖誕樹上會閃的燈＋頂端的星星
function treeLights(ctx, scene, clock) {
  const cx = scene.tree.x * TILE, foot = laneY(0) - 2
  for (let i = 0; i < 22; i++) {
    const r = hash(i, 1), side = hash(i, 2) - 0.5
    const y = foot - 22 - Math.floor(r * 78)
    const half = (1 - (foot - 22 - y) / 100) * 22
    const on = (i + Math.floor(clock / 400)) % 3 !== 0
    if (on) px(ctx, Math.round(cx + side * half * 2), y, 2, 2, ['#ff6f91', '#ffd166', '#7ad7ff', '#ffffff'][i % 4])
  }
  px(ctx, cx - 3, foot - 110, 6, 6, '#ffd166'); px(ctx, cx - 1, foot - 113, 2, 12, '#ffd166'); px(ctx, cx - 6, foot - 108, 12, 2, '#ffd166')
}

// 天黑後：對岸的窗戶、燈塔、路燈、彩燈、聖誕樹、觀景台的燈亮起來
function lights(ctx, scene, clock, camX, viewW) {
  const a = nightAlpha()
  if (a <= 0) return
  ctx.globalAlpha = a
  farTown(ctx, camX, viewW, clock, true)
  ctx.save()
  ctx.translate(-camX, 0)
  const x0 = Math.floor(camX / TILE), x1 = Math.min(scene.width, Math.ceil((camX + viewW) / TILE))
  for (let tx = x0; tx < x1; tx++) {
    ctx.globalAlpha = a
    stringLights(ctx, tx, clock, true)
    if (scene.stalls[tx] === 'S') {
      px(ctx, tx * TILE + 8, 3 * TILE, 8, 6, '#ffe2a0')
      ctx.globalAlpha = 1
      glow(ctx, tx * TILE + 12, 3 * TILE + 3, 24)
    }
  }
  ctx.globalAlpha = a
  if (scene.tree) treeLights(ctx, scene, clock)
  ctx.globalAlpha = 1
  if (scene.tree) glow(ctx, scene.tree.x * TILE, laneY(0) - 60, 40, '255, 200, 140', 0.6)
  if (scene.viewpoint) {
    const X = scene.viewpoint.x * TILE
    ctx.globalAlpha = a
    px(ctx, X - 2, laneY(0) - 56, 7, 5, '#ffe2a0')
    ctx.globalAlpha = 1
    glow(ctx, X + 1, laneY(0) - 54, 22)
  }
  ctx.restore()
}

export default { sky, far, back, front, extras, lights, obstacles: () => [], overlay: () => {}, stallFeet: 7 * TILE - 9 }
