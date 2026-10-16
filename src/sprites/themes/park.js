// 芝公園：傍晚的天空、遠方的鐵塔、黃色銀杏、草地、鐵塔入口
//   0-4 夕陽天空＋鐵塔   3-6 銀杏樹＋草地＋路燈   7-10 碎石步道（有落葉）
import { TILE, px, hash } from '../sceneArt.js'
import { laneY, ground, bandedSky } from '../stage.js'

// ---------- 夕陽、遠方大樓剪影、鐵塔（視差） ----------
function sky(ctx, camX, viewW, clock, scene) {
  bandedSky(ctx, viewW, [[16, '#4a5aa0'], [16, '#6a6ab4'], [16, '#9a78b8'], [16, '#d488a8'], [16, '#f2a08a'], [16, '#f8c08a'], [24, '#fcd89a']])
  // 遠方大樓剪影
  const off = camX * 0.25
  for (let i = Math.floor(off / 12) - 1; i < off / 12 + viewW / 12 + 2; i++) {
    const h = 14 + Math.floor(hash(i, 3) * 26)
    px(ctx, i * 12 - off, 5 * TILE - h, 11, h, '#7a5a8a')
    if (hash(i, 5) > 0.6) px(ctx, i * 12 - off + 4, 5 * TILE - h + 4, 2, 2, '#ffd88a')
  }
  // 鐵塔：走到越右邊越靠近畫面中間
  if (!scene.tower) return // 沒有設定 tower 就不畫鐵塔（試玩版的小鎮）
  const tx = Math.round(scene.tower.screenX - camX * 0.3)
  drawTower(ctx, tx, 6, clock)
}

// 紅白相間的電波塔（傍晚開始點燈）
function drawTower(ctx, cx, top, clock) {
  const H = 150
  const red = '#e8582a', white = '#f3efe8', lit = '#ffb070'
  for (let y = 0; y < H; y++) {
    const t = y / H
    const half = Math.round(2 + Math.pow(t, 1.8) * 34) // 越往下越寬
    const band = Math.floor(y / 12) % 2 === 0 ? red : white
    const Y = top + y
    if (y < 18) { px(ctx, cx, Y, 1, 1, '#c8c8d0'); continue } // 天線
    // 下半部分成四隻腳（中間鏤空的拱形）
    const archGap = y > H * 0.78 ? Math.round((y - H * 0.78) / (H * 0.22) * half * 0.7) : 0
    for (let x = -half; x <= half; x++) {
      if (Math.abs(x) < archGap) continue
      // 鐵架格子：大部分填滿，留一些斜的小洞
      const hole = Math.abs(x) < half - 1 && (x + y) % 4 === 0 && y % 6 !== 0
      if (!hole) px(ctx, cx + x, Y, 1, 1, band)
    }
    // 點燈（暖橘色，沿著兩側往上跑）
    if (y > 20 && (y + Math.floor(clock / 400)) % 9 === 0) {
      px(ctx, cx - half, Y, 1, 1, lit); px(ctx, cx + half, Y, 1, 1, lit)
    }
  }
  // 大展望台、頂部展望台
  px(ctx, cx - 14, top + 62, 29, 9, white); px(ctx, cx - 14, top + 62, 29, 2, red)
  for (let wx = -12; wx < 13; wx += 3) px(ctx, cx + wx, top + 66, 2, 3, '#ffd88a')
  px(ctx, cx - 6, top + 30, 13, 5, white); px(ctx, cx - 6, top + 33, 13, 1, '#ffd88a')
}

// ---------- 後層：銀杏樹、草地、矮欄杆、路燈 ----------
function back(ctx, tx, scene) {
  const X = tx * TILE
  px(ctx, X, 5 * TILE, TILE, 2 * TILE, '#5a7a42')  // 草地
  px(ctx, X, 5 * TILE, TILE, 2, '#6a8a4a')
  for (let i = 0; i < 6; i++) px(ctx, X + Math.floor(hash(tx, i) * TILE), 5 * TILE + 4 + Math.floor(hash(tx, i + 5) * 40), 1, 2, '#7a9a52')
  // 銀杏（每一格都有一棵，交錯高低）
  const ty = 3 * TILE + (tx % 2 ? 6 : 0)
  px(ctx, X + 10, ty + 24, 4, 5 * TILE + 30 - ty - 24, '#5a4030') // 樹幹
  const leaf = ['#f2c230', '#e8a820', '#fbe07a']
  px(ctx, X + 1, ty + 6, 22, 20, leaf[1])
  px(ctx, X + 4, ty, 16, 8, leaf[0])
  px(ctx, X - 2, ty + 10, 6, 10, leaf[0]); px(ctx, X + 20, ty + 10, 6, 10, leaf[0])
  for (let i = 0; i < 8; i++) px(ctx, X + 2 + Math.floor(hash(tx, i + 20) * 18), ty + 2 + Math.floor(hash(tx, i + 30) * 20), 2, 2, leaf[2])
  // 矮欄杆
  px(ctx, X, 6 * TILE + 10, TILE, 2, '#3a3a48')
  for (let sx = 2; sx < TILE; sx += 8) px(ctx, X + sx, 6 * TILE + 10, 2, 14, '#3a3a48')
  // 路燈（S 的位置）
  if (scene.stalls[tx] === 'S') {
    px(ctx, X + 11, 4 * TILE, 2, 3 * TILE, '#2a3a32')
    px(ctx, X + 7, 4 * TILE - 8, 10, 9, '#2a3a32')
    px(ctx, X + 9, 4 * TILE - 6, 6, 5, '#ffe2a0')
    px(ctx, X + 8, 7 * TILE - 2, 8, 2, '#2a3a32')
  }
}

function front(ctx, tx) {
  ground(ctx, tx, {
    base: '#d8c8a8', edge: '#a8987a', curb: '#9a8a6a', curbHi: '#e8dcc0',
    dots: ['#f2c230', '#e8a820', '#c0b090', '#f2c230', '#b8a888'], dotSize: 2,
  })
}

// ---------- 飄落的銀杏葉＋鐵塔入口 ----------
function extras(ctx, scene, clock, worldW) {
  // 入口（售票處）
  if (scene.gate) {
    const X = scene.gate.x * TILE, W = 3 * TILE, bottom = laneY(0)
    px(ctx, X, 3 * TILE, W, bottom - 3 * TILE, '#e8e8ec')
    px(ctx, X, 3 * TILE, W, 3, '#c8c8d0')
    for (let sx = 0; sx < W; sx += 8) px(ctx, X + sx, 3 * TILE + 3, 4, 8, '#e8582a') // 紅白遮雨棚
    px(ctx, X, 3 * TILE + 11, W, 1, '#9a3a1e')
    px(ctx, X + 8, 3 * TILE + 18, W - 16, 10, '#2a3048')   // 招牌（車票圖示）
    px(ctx, X + W / 2 - 9, 3 * TILE + 20, 18, 6, '#ffd166')
    px(ctx, X + W / 2 - 1, 3 * TILE + 20, 2, 6, '#2a3048')
    const doorY = bottom - 46
    px(ctx, X + 10, doorY, W - 20, 46, '#2a3048')
    px(ctx, X + 12, doorY + 3, (W - 26) / 2, 43, '#5a7aa8'); px(ctx, X + W / 2 + 1, doorY + 3, (W - 26) / 2, 43, '#5a7aa8')
    px(ctx, X + 14, doorY + 5, 6, 14, '#bfe0ff'); px(ctx, X + W / 2 + 3, doorY + 5, 6, 14, '#bfe0ff')
  }
  // 飄落的葉子（世界座標，跟著畫面捲動）
  for (let i = 0; i < 26; i++) {
    const speed = 14 + hash(i, 1) * 12
    const y = ((clock / 1000) * speed + hash(i, 2) * 400) % 220 - 20
    const x = (hash(i, 3) * worldW + Math.sin(clock / 700 + i) * 10) % worldW
    px(ctx, Math.round(x), Math.round(y), 2, 1, i % 3 ? '#f2c230' : '#e8a820')
  }
}

export default { sky, back, front, extras, obstacles: () => [], overlay: () => {}, stallFeet: 7 * TILE - 9 }
