<script setup>
// 橫向捲軸場景：左右走＋上下換排（路面 5 排），靠近人或物件出現放大鏡
// 每一區的畫面由 scene.theme 決定（themes/ 資料夾）；有 scene.finale 的區域是最終章
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import GamePad from './GamePad.vue'
import FlashbackView from './FlashbackView.vue'
import { GAME_TITLE, QUIZ_LABEL } from '@route'
import OmikujiGame from './OmikujiGame.vue'
import {
  TILE, objectCanvas, girlCanvas, girlPoseCanvas, boyCanvas, magnifierCanvas, itemCanvas,
} from '../sprites/sceneArt.js'
import { ROWS, LANES, laneY } from '../sprites/stage.js'
import { THEMES } from '../sprites/themes/index.js'
import { createFireworks } from '../sprites/fireworks.js'
import { light, updateLight } from '../sprites/daylight.js'
import { isPresent, linesFor } from '../sprites/shopHours.js'
import { now, isSeen, markSeen, hasFlag, setFlag, clearFlag, hasItem, addItem, itemIds, msUntil, drawCount, addDraw, fortune, setFortune, endingIds } from '../composables/useProgress.js'

const props = defineProps({ scene: { type: Object, required: true } })
const emit = defineEmits(['title-tap', 'exit', 'finale-done', 'route-ending'])

const VIEW_W = 8 * TILE
const VIEW_H = ROWS * TILE
const WALK_SPEED = 72     // 主角每秒走幾像素
const LANE_SPEED = 7      // 主角每秒換幾排
const NPC_SPEED = 26      // 路人每秒走幾像素
const REACH = 22          // 離人多近會出現放大鏡（像素）
const SPRITE_W = 24
const SPRITE_H = 37

const scene = props.scene
const theme = THEMES[scene.theme || 'ameyoko']
const worldW = scene.width * TILE
const doorX = scene.exit.x * TILE // 走到這裡就是這一區的終點
const key = (id) => `${scene.id}:${id}`
const rand = (a, b) => a + Math.random() * (b - a)

const canvas = ref(null)

// ---------- 主角 ----------
const startLane = scene.start.lane ?? 2
const player = {
  x: scene.start.x * TILE,  // 人物左邊緣
  lane: startLane,          // 目前位置（換排中會是小數）
  laneTarget: startLane,
  facing: scene.start.facing || 'right',
  moving: false, step: 0, stepClock: 0,
}
const centerX = (a) => a.x + SPRITE_W / 2

// 門的柱子之類的障礙物：實心，不能穿過
const obstacles = theme.obstacles(scene)
function blocked(cx, lane) {
  return obstacles.some((p) => Math.abs(lane - p.lane) < 0.6 && cx > p.x - 7 && cx < p.x + p.w + 7)
}

// ---------- 場景裡的人和物件 ----------
const actors = scene.objects.map((o) => ({
  ...o,
  x: o.x * TILE,
  lane: o.lane ?? 0,
  laneTarget: o.lane ?? 0,
  facing: 'right',
  moving: false, step: 0, stepClock: 0,
  pause: rand(0, 2000),
  targetX: o.x * TILE,
}))
const present = (a) => isPresent(scene, a) // 依營業時間：收攤後店員不在、街上人變少
const talkable = (a) => !!a.lines && present(a)

function inReach(a) {
  const dx = Math.abs(centerX(a) - centerX(player))
  if (a.inStall) return player.lane <= 0.5 && dx <= REACH + 4 // 攤位裡的人：要走到最裡面那排
  return dx <= REACH && Math.abs(a.lane - player.lane) <= 1.01
}
function nearest() {
  let best = null, bestD = Infinity
  actors.forEach((a) => {
    if (!talkable(a) || !inReach(a)) return
    const d = Math.abs(centerX(a) - centerX(player)) + Math.abs(a.lane - player.lane) * 10
    if (d < bestD) { best = a; bestD = d }
  })
  return best
}
const atDoor = () => centerX(player) >= doorX - 4

// ---------- 對話框 ----------
const dialog = reactive({ open: false, name: '', lines: [], index: 0, shown: 0, onClose: null })
let typeTimer = null

function openDialog(name, lines, onClose = null) {
  held.length = 0
  Object.assign(dialog, { open: true, name, lines, index: 0, shown: 0, onClose })
  typeLine()
}
function typeLine() {
  clearInterval(typeTimer)
  dialog.shown = 0
  const full = dialog.lines[dialog.index]
  typeTimer = setInterval(() => {
    dialog.shown++
    if (dialog.shown >= full.length) clearInterval(typeTimer)
  }, 35)
}
const currentText = computed(() => (dialog.open ? dialog.lines[dialog.index].slice(0, dialog.shown) : ''))
const lineDone = computed(() => dialog.open && dialog.shown >= dialog.lines[dialog.index].length)

function advance() {
  if (!dialog.open) return
  if (!lineDone.value) {
    clearInterval(typeTimer)
    dialog.shown = dialog.lines[dialog.index].length
    return
  }
  if (dialog.index < dialog.lines.length - 1) {
    dialog.index++
    typeLine()
  } else {
    dialog.open = false
    const cb = dialog.onClose
    dialog.onClose = null
    cb?.()
  }
}

let talkingTo = null
function inspect(a) {
  talkingTo = a // 對話中這個人會停下來面向她
  if (a.quiz) {
    if (isSeen(key(a.id))) return openDialog(a.name, a.afterLines || a.lines)
    if (a.omikuji && isSeen(key(`${a.id}:quiz`))) { // 題目答對了、但還沒抽到大吉
      return openDialog(a.name, a.omikuji.againLines, () => openOmikuji(a))
    }
    return openDialog(a.name, linesFor(a), () => openQuiz(a))
  }
  markSeen(key(a.id))
  if (a.setFlag) setFlag(a.setFlag)
  openDialog(a.name, linesFor(a))
}

function tryExit() {
  const ex = scene.exit
  if (ex.requireFlag && !hasFlag(ex.requireFlag)) {
    player.x -= 6 // 往回退一點，避免一直觸發
    return openDialog('', ex.lockedLines)
  }
  if (scene.finale) return arriveFinale()
  openDialog('', ex.doneLines, () => emit('exit', scene.id))
}

// ---------- 回憶題 ----------
const quiz = reactive({ open: false, obj: null, selected: 0, wrong: 0 })

function openQuiz(obj) {
  held.length = 0
  Object.assign(quiz, { open: true, obj, selected: 0 })
}

function choose(i) {
  const q = quiz.obj.quiz
  const obj = quiz.obj
  quiz.open = false
  if (i !== q.answer) {
    const hint = q.hints[Math.min(quiz.wrong, q.hints.length - 1)]
    quiz.wrong++
    return openDialog(obj.name, [hint], () => openQuiz(obj))
  }
  quiz.wrong = 0
  if (obj.omikuji) { // 答對後去抽籤，抽到大吉才算完成
    markSeen(key(`${obj.id}:quiz`))
    return openDialog(obj.name, q.successLines, () => openOmikuji(obj))
  }
  markSeen(key(obj.id))
  if (obj.setFlag) setFlag(obj.setFlag)
  openDialog(obj.name, q.successLines, () => playFlashback(q.flashback, () => {
    if (q.reward && !hasItem(q.reward.id)) addItem(q.reward.id)
    if (q.reward) showItem(q.reward)
  }))
}

// ---------- 回憶畫面（閃回） ----------
const flash = reactive({ open: false, data: null, then: null })
const flashRef = ref(null)
function playFlashback(data, then) {
  if (!data) return then()
  held.length = 0
  Object.assign(flash, { open: true, data, then })
}
function onFlashbackDone() {
  const then = flash.then
  Object.assign(flash, { open: false, data: null, then: null })
  then?.()
}

// ---------- 抽籤（運氣骰） ----------
const omikuji = reactive({ open: false, obj: null })
function openOmikuji(obj) {
  held.length = 0
  Object.assign(omikuji, { open: true, obj })
}
// 收下抽到的籤：記住是哪一支（決定最終章怎麼演），拿到籤紙道具，正殿的終點打開
function onOmikujiTake(f) {
  const obj = omikuji.obj
  omikuji.open = false
  setFortune(f.rank)
  markSeen(key(obj.id))
  if (obj.setFlag) setFlag(obj.setFlag)
  const reward = {
    id: f.rank === '大吉' ? 'fortune' : 'fortune-plain',
    name: `${f.rank}籤`,
    note: `${f.rank}\n${f.text}\n\n${obj.quiz.message}`,
    fragment: obj.quiz.fragment,
  }
  openDialog(obj.name, f.lines, () => {
    addItem(reward.id)
    // 重抽的話：收下籤之後直接趕去碼頭
    showItem(reward, hasFlag('redraw') ? () => openDialog('', obj.omikuji.redrawLines, () => { clearFlag('redraw'); emit('exit', scene.id) }) : null)
  })
}

// ---------- 獲得道具 ----------
const itemPopup = reactive({ open: false, reward: null })
const itemCanvasEl = ref(null)

let afterItem = null
async function showItem(reward, then = null) {
  held.length = 0
  afterItem = then
  Object.assign(itemPopup, { open: true, reward })
  await nextTick()
  const img = itemCanvas(reward.id)
  const el = itemCanvasEl.value
  if (!img || !el) return
  el.width = img.width * 4
  el.height = img.height * 4
  const ctx = el.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, el.width, el.height)
}
function closeItem() {
  itemPopup.open = false
  const then = afterItem
  afterItem = null
  if (then) then()
}

// ---------- 最終章：等煙火 → 最後一幕 → 求婚 ----------
//   phase：none（平常）→ waiting → show → walk → talk → kneel → question → yes
//   最後一幕怎麼演，看神社抽到的籤（sea.js 的 finale.variants）
const F = scene.finale || {}
const V = { ...F, ...(F.variants?.[fortune.value] || F.variants?.['大吉'] || {}) }
const fin = reactive({ phase: 'none', t: 0, boyX: 0, step: 0, stepClock: 0, said: false, noTries: 0, noPos: null, qShown: 0, canFinish: false })
const isProposal = !fortune.value || fortune.value === '大吉'
const fireworks = createFireworks()
let fireworksOn = false
const waitMs = computed(() => (scene.finale ? msUntil(F.at) : 0))
const waitText = computed(() => {
  const s = Math.floor(waitMs.value / 1000)
  const d = Math.floor(s / 86400)
  const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  return d > 0 ? `${d} 天 ${hms}` : hms
})
const boyHere = () => !['none'].includes(fin.phase) && (V.entrance === 'waiting' || ['walk', 'talk', 'linger', 'ended', 'kneel', 'question', 'yes'].includes(fin.phase))

function standAtViewpoint() {
  player.x = doorX - SPRITE_W / 2 - 18
  player.facing = 'right'
  if (V.entrance === 'waiting') fin.boyX = player.x - 26 // 他已經在碼頭等她了
}

function arriveFinale() {
  standAtViewpoint()
  fin.phase = 'arrive'
  openDialog('', V.arriveLines, () => {
    markSeen(key('waiting'))
    fin.phase = 'waiting'
  })
}

function startShow() { // 時間到：煙火（或延後／取消的廣播）
  Object.assign(fin, { phase: 'show', t: 0 })
  fireworksOn = V.fireworks === 'on'
}

function boyEnters() {
  if (V.entrance === 'waiting') return boyTalks()
  Object.assign(fin, { phase: 'walk', t: 0, boyX: camX - 30 })
}

function boyTalks() {
  Object.assign(fin, { phase: 'talk', t: 0 })
  player.facing = 'left' // 轉頭看他
  openDialog(V.boyName || '他', V.boyLines, () => {
    // 只有大吉會走到求婚；其他籤：兩個人一起看一下煙火，然後就是那支籤的結局
    if (isProposal) return Object.assign(fin, { phase: 'kneel', t: 0 })
    if (V.fireworks === 'delayed') fireworksOn = true // 延後的煙火在這時才開始
    Object.assign(fin, { phase: 'linger', t: 0 })
  })
}

function updateFinale(dt) {
  fireworks.update(dt, fireworksOn)
  if (fin.phase === 'none' || fin.phase === 'arrive') return
  fin.t += dt
  if (fin.phase === 'waiting' && waitMs.value === 0) {
    startShow()
  } else if (fin.phase === 'show' && fin.t > (V.fireworks === 'on' ? 2800 : 900) && !fin.said) {
    fin.said = true
    openDialog('', V.startLines, boyEnters)
  } else if (fin.phase === 'walk') {
    const speed = V.entrance === 'run' ? 95 : 34
    fin.boyX = approach(fin.boyX, player.x - 26, speed * (dt / 1000))
    animateStep(fin, dt, V.entrance === 'run' ? 90 : 180)
    if (fin.boyX === player.x - 26) boyTalks()
  } else if (fin.phase === 'linger' && fin.t > 4200) {
    fin.phase = 'ended'
    emit('route-ending', { rank: fortune.value, hint: F.routeHint, ...V.ending })
  } else if (fin.phase === 'kneel' && fin.t > 2400) {
    Object.assign(fin, { phase: 'question', t: 0, qShown: 0 })
  } else if (fin.phase === 'question') {
    fin.qShown = Math.min(V.question.length, Math.floor(fin.t / 160)) // 問題一個字一個字出現
  } else if (fin.phase === 'yes' && fin.t > 3500) {
    fin.canFinish = true
  }
}

// 「不願意」會逃跑
//   第 1～N 次：逃跑並換成 noTaunts 的字；第 N+1 次：停下來變成 noFinal；再按一次就是答應
const noLabel = computed(() => {
  const taunts = V.noTaunts || []
  if (fin.noTries === 0) return V.no
  return fin.noTries <= taunts.length ? taunts[fin.noTries - 1] : V.noFinal
})
function dodge() {
  const taunts = V.noTaunts || []
  if (fin.noTries > taunts.length) return sayYes()
  fin.noTries++
  if (fin.noTries > taunts.length) return // 不再逃跑，乖乖變成「願意」
  const top = Math.random() < 0.5 ? 6 + Math.random() * 14 : 74 + Math.random() * 14 // 上方或下方，避開問題和「願意」
  fin.noPos = { left: `${6 + Math.random() * 54}%`, top: `${top}%` }
}
function sayYes() {
  Object.assign(fin, { phase: 'yes', t: 0, canFinish: false })
  if (V.fireworks === 'delayed') fireworksOn = true // 延後的煙火，在她答應的瞬間開始
}
function finishFinale() {
  if (fin.canFinish) emit('finale-done')
}

const busy = () => flash.open || dialog.open || quiz.open || itemPopup.open || omikuji.open || fin.phase !== 'none'

// ---------- 輸入 ----------
const held = []
function press(dir) {
  if (quiz.open) { // 出題中：上下選答案
    const n = quiz.obj.quiz.options.length
    if (dir === 'up') quiz.selected = (quiz.selected + n - 1) % n
    if (dir === 'down') quiz.selected = (quiz.selected + 1) % n
    return
  }
  if (busy()) return
  const i = held.indexOf(dir)
  if (i >= 0) held.splice(i, 1)
  held.push(dir)
}
function release(dir) {
  const i = held.indexOf(dir)
  if (i >= 0) held.splice(i, 1)
}
function onA() {
  if (flash.open) return flashRef.value?.advance()
  if (itemPopup.open) return closeItem()
  if (quiz.open) return choose(quiz.selected)
  if (dialog.open) return advance()
  if (fin.phase === 'yes') return finishFinale()
  if (fin.phase !== 'none') return
  if (atDoor()) return tryExit()
  const a = nearest()
  if (a) inspect(a)
}

const magnifierBoxes = []
let camX = 0
function onCanvasTap(e) {
  if (dialog.open) return advance()
  if (busy()) return
  const rect = canvas.value.getBoundingClientRect()
  const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W
  const sy = ((e.clientY - rect.top) / rect.height) * VIEW_H
  const hit = magnifierBoxes.find((b) => sx >= b.x - 6 && sx <= b.x + 19 && sy >= b.y - 6 && sy <= b.y + 19)
  if (hit) inspect(hit.actor)
}

const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
function onKeyDown(e) {
  if (KEYMAP[e.key]) { e.preventDefault(); if (!e.repeat) press(KEYMAP[e.key]) }
  if ([' ', 'Enter', 'z', 'j'].includes(e.key)) { e.preventDefault(); if (!e.repeat) onA() }
}
function onKeyUp(e) {
  if (KEYMAP[e.key]) release(KEYMAP[e.key])
}

// ---------- 更新 ----------
function lastOf(dirs) {
  for (let i = held.length - 1; i >= 0; i--) if (dirs.includes(held[i])) return held[i]
  return null
}

function approach(v, target, maxStep) {
  return Math.abs(target - v) <= maxStep ? target : v + Math.sign(target - v) * maxStep
}

function animateStep(a, dt, every) {
  a.stepClock += dt
  if (a.stepClock > every) { a.stepClock = 0; a.step ^= 1 }
}

function updatePlayer(dt) {
  const h = busy() ? null : lastOf(['left', 'right'])
  const v = busy() ? null : lastOf(['up', 'down'])

  if (v && player.lane === player.laneTarget) { // 換排：到達目前這排後才接受下一次
    const next = Math.max(0, Math.min(LANES - 1, player.laneTarget + (v === 'up' ? -1 : 1)))
    if (!blocked(centerX(player), next)) player.laneTarget = next
  }
  const wasLane = player.lane
  player.lane = approach(player.lane, player.laneTarget, LANE_SPEED * (dt / 1000))

  if (h) {
    player.facing = h
    const dx = (h === 'right' ? 1 : -1) * WALK_SPEED * (dt / 1000)
    const nx = Math.max(0, Math.min(player.x + dx, doorX - SPRITE_W / 2 + 2))
    if (!blocked(nx + SPRITE_W / 2, player.lane)) player.x = nx
    if (h === 'right' && atDoor()) tryExit()
  } else if (v && wasLane !== player.lane) {
    player.facing = v
  }

  player.moving = !!h || wasLane !== player.lane
  if (player.moving) animateStep(player, dt, 150)
}

function updateWalker(a, dt) {
  if (talkingTo === a && busy()) { // 被搭話：停下來面向她
    a.moving = false
    return
  }
  a.lane = approach(a.lane, a.laneTarget, 3 * (dt / 1000))
  if (a.pause > 0) {
    a.pause -= dt
    a.moving = false
    if (a.pause <= 0) {
      a.targetX = rand(a.walk.from, a.walk.to) * TILE
      if (Math.random() < 0.35) {
        a.laneTarget = Math.max(0, Math.min(LANES - 1, a.laneTarget + (Math.random() < 0.5 ? -1 : 1)))
      }
    }
    return
  }
  const dx = a.targetX - a.x
  if (Math.abs(dx) < 1) {
    a.pause = rand(800, 3500)
    a.moving = false
    return
  }
  a.facing = dx > 0 ? 'right' : 'left'
  a.x = approach(a.x, a.targetX, NPC_SPEED * (dt / 1000))
  a.moving = true
  animateStep(a, dt, 220)
}

// ---------- 畫面 ----------
let raf = null
let last = 0
let clock = 0

function drawSprite(ctx, img, x, y, flip) {
  if (!flip) return ctx.drawImage(img, x, y)
  ctx.save()
  ctx.translate(x + img.width, y)
  ctx.scale(-1, 1)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

const feetOf = (a) => (a.inStall ? theme.stallFeet : Math.round(laneY(a.lane)))

// 街上的人現在該用哪個姿勢
function poseOf(a) {
  if (talkingTo === a && busy()) return { img: objectCanvas(a, 0), flip: false } // 跟她說話：轉正面
  if (a.moving) return { img: objectCanvas(a, a.step, 'side'), flip: a.facing === 'left' }
  if (a.shop) {
    // 在攤位前挑東西：大部分時間背對鏡頭，偶爾轉頭看旁邊
    const t = (clock + a.x * 37) % 5200
    if (t < 900) return { img: objectCanvas(a, 1, 'side'), flip: Math.floor((clock + a.x * 37) / 5200) % 2 === 0 }
    return { img: objectCanvas(a, 0, 'back'), flip: false }
  }
  if (a.walk && a.lane < 0.5) return { img: objectCanvas(a, 0, 'back'), flip: false } // 走到攤位前停下來逛
  return { img: objectCanvas(a, 0), flip: false }
}

// 主角（和最終章的他）這一幀的樣子
function playerSprite() {
  const idle = Math.floor(clock / 550) % 2
  if (['kneel', 'question', 'yes'].includes(fin.phase)) return { img: girlPoseCanvas('surprise', idle), flip: false }
  const frame = player.moving ? player.step : idle
  return { img: girlCanvas(player.facing, player.moving, frame), flip: player.facing === 'left' }
}
function boySprite() {
  const idle = Math.floor(clock / 550) % 2
  if (fin.phase === 'walk') return boyCanvas('side-walk', fin.step || 0)
  if (['arrive', 'waiting', 'show', 'talk', 'linger', 'ended'].includes(fin.phase)) return boyCanvas('side-idle', idle)
  return boyCanvas('kneel', idle)
}

// 他手上的東西：兩杯熱可可（說話時）、仙女棒（說話到求婚都一直亮著）
function drawProp(ctx, bx, feet) {
  const p = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h) }
  if (V.prop === 'cocoa' && ['talk', 'linger', 'ended'].includes(fin.phase)) {
    ;[0, 6].forEach((dx) => {
      const x = bx + 17 + dx, y = feet - 14
      p(x, y, 5, 6, '#f3efe8'); p(x, y, 5, 1, '#6a3a20'); p(x + 5, y + 2, 1, 2, '#f3efe8')
      if (Math.floor(clock / 300 + dx) % 2) p(x + 1, y - 3, 1, 2, '#e8e8f0'); else p(x + 3, y - 4, 1, 2, '#e8e8f0') // 熱氣
    })
  }
  if (V.prop === 'sparkler' && ['talk', 'kneel', 'question', 'yes'].includes(fin.phase)) {
    const kneel = fin.phase !== 'talk'
    const tipX = bx + (kneel ? -2 : 20), tipY = feet - (kneel ? 26 : 30)
    p(tipX, tipY, 1, 12, '#7a7a88') // 棒子
    for (let i = 0; i < 9; i++) { // 火花
      const a = (i / 9) * Math.PI * 2 + clock / 140
      const r = 2 + ((clock / 60 + i * 7) % 6)
      p(tipX + Math.cos(a) * r, tipY + Math.sin(a) * r, 1, 1, i % 3 ? '#ffd166' : '#ffffff')
    }
    p(tipX - 1, tipY - 1, 3, 3, '#fff2c8')
  }
}

function render() {
  const ctx = canvas.value.getContext('2d')
  ctx.imageSmoothingEnabled = false
  camX = Math.round(Math.max(0, Math.min(centerX(player) - VIEW_W / 2, worldW - VIEW_W)))
  const x0 = Math.floor(camX / TILE), x1 = Math.min(Math.ceil((camX + VIEW_W) / TILE), scene.width)

  // 天空 → 遠景（畫面座標）；天色跟著日本時間
  updateLight(now.value)
  theme.sky(ctx, camX, VIEW_W, clock, scene)
  theme.far?.(ctx, camX, VIEW_W, clock, scene)

  ctx.save()
  ctx.translate(-camX, 0)

  for (let tx = x0; tx < x1; tx++) theme.back(ctx, tx, scene, clock)
  theme.extras(ctx, scene, clock, worldW)

  // 攤位裡的人：站在櫃檯後面
  actors.filter((a) => a.inStall && present(a)).forEach((a) => {
    drawSprite(ctx, objectCanvas(a, 0), Math.round(a.x), theme.stallFeet - SPRITE_H, false)
  })

  for (let tx = x0; tx < x1; tx++) theme.front(ctx, tx, scene)

  // 街上的人＋柱子：依前後排排序，靠鏡頭的蓋住後面的
  const layer = actors.filter((a) => !a.inStall && present(a)).map((a) => {
    const { img, flip } = poseOf(a)
    const feet = feetOf(a)
    return { feet, draw: () => drawSprite(ctx, img, Math.round(a.x), feet - SPRITE_H, flip) }
  })
  const pFeet = Math.round(laneY(player.lane))
  const me = playerSprite()
  layer.push({ feet: pFeet + 0.5, draw: () => drawSprite(ctx, me.img, Math.round(player.x), pFeet - SPRITE_H, me.flip) })
  if (boyHere()) {
    const img = boySprite()
    layer.push({ feet: pFeet + 0.4, draw: () => { drawSprite(ctx, img, Math.round(fin.boyX), pFeet - SPRITE_H, false); drawProp(ctx, fin.boyX, pFeet) } })
  }
  obstacles.forEach((p) => layer.push({ feet: p.foot - 1, draw: () => p.draw(ctx) }))
  layer.sort((a, b) => a.feet - b.feet)
  layer.forEach((e) => e.draw())

  theme.overlay(ctx, scene) // 門的橫樑和招牌：在所有人上方

  // 放大鏡：還沒查過、而且在範圍內的人
  magnifierBoxes.length = 0
  if (!busy()) {
    const bob = Math.round(Math.sin(clock / 180) * 2)
    actors.forEach((a) => {
      if (!talkable(a) || isSeen(key(a.id)) || !inReach(a)) return
      const mx = Math.round(a.x) + 6
      const my = feetOf(a) - SPRITE_H - 15 + bob
      ctx.drawImage(magnifierCanvas(), mx, my)
      magnifierBoxes.push({ x: mx - camX, y: my, actor: a })
    })
  }
  ctx.restore()

  // 天黑：整個畫面蓋一層深藍，再把會發光的東西（路燈、窗戶、彩燈）畫回來
  if (light.dark > 0) {
    ctx.fillStyle = `rgba(12, 16, 46, ${0.5 * light.dark})`
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
  theme.lights?.(ctx, scene, clock, camX, VIEW_W)
  // 煙火畫在最上層（才不會被夜色蓋暗），只出現在天空那一塊
  ctx.save()
  ctx.beginPath(); ctx.rect(0, 0, VIEW_W, 3 * TILE); ctx.clip()
  fireworks.draw(ctx)
  ctx.restore()

  // 右上角的道具欄（最終章等煙火、放煙火時先藏起來）
  if (fin.phase !== 'none') return
  let iy = 6
  itemIds.value.forEach((id) => {
    const img = itemCanvas(id)
    if (!img) return
    const s = img.height > 20 ? 0.5 : 1 // 大的道具縮小一半
    const w = Math.round(img.width * s), h = Math.round(img.height * s)
    const x = VIEW_W - w - 6
    ctx.fillStyle = 'rgba(20,26,51,0.75)'
    ctx.fillRect(x - 3, iy - 3, w + 6, h + 6)
    ctx.drawImage(img, x, iy, w, h)
    iy += h + 8
  })
}

function loop(t) {
  const dt = last ? Math.min(t - last, 50) : 16
  last = t
  clock += dt
  updatePlayer(dt)
  actors.forEach((a) => { if (a.walk) updateWalker(a, dt) })
  updateFinale(dt)
  render()
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  if (scene.finale && isSeen(key('waiting'))) { // 重新打開時，直接回到碼頭等煙火
    player.lane = player.laneTarget = 2
    standAtViewpoint()
    fin.phase = 'waiting'
  } else if (scene.intro && !isSeen(key('intro'))) {
    openDialog(scene.introName || '', scene.intro, () => markSeen(key('intro')))
  }
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearInterval(typeTimer)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div class="console">
    <h1 class="title" @click="emit('title-tap')">{{ scene.title === GAME_TITLE ? GAME_TITLE : `${GAME_TITLE}・${scene.title}` }}</h1>

    <div class="screen">
      <canvas ref="canvas" class="game" :width="VIEW_W" :height="VIEW_H" @pointerdown="onCanvasTap" />

      <div v-if="dialog.open" class="dialog" :class="{ mid: fin.phase !== 'none' }" @pointerdown="advance">
        <p v-if="dialog.name" class="name">{{ dialog.name }}</p>
        <p class="text">{{ currentText }}</p>
        <span v-if="lineDone" class="next">▼</span>
      </div>

      <!-- 回憶題 -->
      <div v-if="quiz.open" class="quiz">
        <p class="name">{{ QUIZ_LABEL }}</p>
        <p class="question">{{ quiz.obj.quiz.question }}</p>
        <button
          v-for="(opt, i) in quiz.obj.quiz.options"
          :key="i"
          class="option"
          :class="{ on: quiz.selected === i }"
          @pointerdown.prevent="quiz.selected = i; choose(i)"
        >
          {{ opt }}
        </button>
      </div>

      <!-- 抽籤 -->
      <OmikujiGame
        v-if="omikuji.open"
        :config="omikuji.obj.omikuji"
        :message="omikuji.obj.quiz.message"
        :draw-count="drawCount"
        :exclude="endingIds"
        @drew="addDraw"
        @take="onOmikujiTake"
      />

      <!-- 回憶畫面 -->
      <FlashbackView v-if="flash.open" ref="flashRef" :flashback="flash.data" @done="onFlashbackDone" />

      <!-- 獲得道具 -->
      <div v-if="itemPopup.open" class="item-pop" @pointerdown.prevent="closeItem">
        <p class="got">{{ itemPopup.reward.fragment ? `回憶碎片 ${itemPopup.reward.fragment.n} / ${itemPopup.reward.fragment.of}` : '獲得道具！' }}</p>
        <canvas ref="itemCanvasEl" class="item-img" />
        <p class="item-name">{{ itemPopup.reward.name }}</p>
        <p v-if="itemPopup.reward.fragment" class="frag">「{{ itemPopup.reward.fragment.text }}」</p>
        <p class="note">{{ itemPopup.reward.note }}</p>
        <p class="tap">點一下繼續</p>
      </div>

      <!-- 最終章：等煙火 -->
      <div v-if="fin.phase === 'waiting'" class="wait-box">
        <p class="wait-title">{{ V.waitTitle }}</p>
        <p class="count">{{ waitText }}</p>
        <p class="wait-note">{{ V.waitNote }}</p>
      </div>

      <!-- 最終章：求婚 -->
      <div v-if="fin.phase === 'question'" class="propose">
        <p class="q">{{ V.question.slice(0, fin.qShown) }}</p>
        <template v-if="fin.qShown >= V.question.length">
          <button class="yes" @pointerdown.prevent="sayYes">{{ V.yes }}</button>
          <button
            class="no"
            :class="{ moved: fin.noPos }"
            :style="fin.noPos || {}"
            @pointerdown.prevent="dodge"
            @pointerenter="(e) => e.pointerType === 'mouse' && fin.noTries < (V.noTaunts || []).length && dodge()"
          >
            {{ noLabel }}
          </button>
        </template>
      </div>
      <div v-if="fin.phase === 'yes'" class="propose yes-screen" @pointerdown.prevent="finishFinale">
        <span v-for="i in 14" :key="i" class="heart" :style="{ left: `${(i * 37) % 92 + 2}%`, animationDelay: `${(i % 7) * 0.35}s` }">♥</span>
        <p class="turn">{{ V.afterYes }}</p>
        <p class="turn-sub">{{ V.afterYesSub }}</p>
        <p v-if="fin.canFinish" class="tap">點一下繼續</p>
      </div>
    </div>

    <GamePad @press="press" @release="release" @a="onA" />
  </div>
</template>

<style scoped>
.console { max-width: 420px; margin: 0 auto; user-select: none; -webkit-user-select: none; touch-action: none; } /* 在遊戲上滑手指不會捲動頁面 */
.title { font-size: 16px; text-align: center; letter-spacing: 2px; margin-bottom: 8px; }
.screen {
  /* 畫面寬度依螢幕高度縮小，讓下面的按鈕一定看得到（扣掉標題、按鈕、上下留白約 265px） */
  width: min(100%, calc((100vh - 265px) * 192 / 264)); width: min(100%, calc((100dvh - 265px) * 192 / 264)); margin: 0 auto;
  position: relative; border: 4px solid #f3efe8; background: #000; touch-action: none; overflow: hidden; }
.game { display: block; width: 100%; aspect-ratio: 192 / 264; image-rendering: pixelated; }
/* 對話框固定在畫面上方：主角走在下面的路上，不會被擋住 */
.dialog {
  position: absolute; left: 6px; right: 6px; top: 6px; min-height: 26%;
  background: #f3efe8; color: #1b2140; border: 4px solid #1b2140; outline: 3px solid #f3efe8;
  padding: 10px 12px 18px; cursor: pointer; z-index: 5;
}
.dialog.mid { top: 33%; }
.name { font-size: 13px; font-weight: 700; color: #c23b4a; margin-bottom: 4px; }
.text { font-size: 16px; line-height: 1.6; }
.next { position: absolute; right: 10px; bottom: 4px; font-size: 12px; animation: blink 0.6s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.quiz {
  position: absolute; inset: 6px; background: #f3efe8; color: #1b2140;
  border: 4px solid #1b2140; outline: 3px solid #f3efe8;
  padding: 12px; display: flex; flex-direction: column; gap: 8px; z-index: 5;
}
.question { font-size: 16px; line-height: 1.5; margin-bottom: 4px; }
.option {
  font: inherit; font-size: 15px; text-align: left; padding: 9px 12px; cursor: pointer;
  background: #fff; color: #1b2140; border: 3px solid #1b2140;
}
.option.on { background: #1b2140; color: #f3efe8; }
.option.on::before { content: '▶ '; }

.frag { font-size: 16px; color: #ffd166; letter-spacing: 1px; }
.item-pop {
  position: absolute; inset: 0; background: rgba(12, 16, 36, 0.92); color: #f3efe8;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 20px; text-align: center; cursor: pointer; z-index: 6;
}
.got { font-size: 14px; color: #ffd166; letter-spacing: 2px; animation: pop 0.4s ease-out; }
.item-img { display: block; width: 136px; height: auto; image-rendering: pixelated; animation: pop 0.5s ease-out; }
.item-name { font-size: 18px; font-weight: 700; }
.note {
  white-space: pre-line; font-size: 15px; line-height: 1.7; color: #1b2140;
  background: #fff8e8; border: 3px solid #c9a46a; padding: 10px 14px; max-width: 90%;
}
.tap { font-size: 12px; opacity: 0.6; animation: blink 1s steps(2) infinite; }
@keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 70% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }

/* 等煙火的倒數 */
.wait-box {
  position: absolute; left: 6px; right: 6px; top: 6px; z-index: 4; text-align: center;
  background: rgba(12, 16, 36, 0.82); color: #f3efe8; border: 3px solid #ffd166; padding: 10px 12px;
}
.wait-title { font-size: 15px; }
.count { font-size: 30px; letter-spacing: 2px; color: #ffd166; font-variant-numeric: tabular-nums; margin: 4px 0; }
.wait-note { font-size: 12px; opacity: 0.75; line-height: 1.5; white-space: pre-line; }

/* 求婚畫面：半透明，後面的煙火還看得到 */
.propose {
  position: absolute; inset: 0; z-index: 7; background: rgba(10, 12, 30, 0.55); color: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 20px;
}
.q { font-size: 24px; font-weight: 700; letter-spacing: 3px; text-align: center; line-height: 1.6; text-shadow: 0 2px 0 #c23b4a; min-height: 2em; }
.yes, .no {
  font: inherit; font-size: 18px; font-weight: 700; padding: 10px 34px; cursor: pointer; border: 4px solid #fff;
}
.yes { background: #ff6f91; color: #fff; box-shadow: 0 4px 0 #b8456a; animation: pop 0.5s ease-out; }
.no { background: #3a3f5c; color: #d8d8e8; font-size: 14px; padding: 6px 16px; }
.no.moved { position: absolute; transition: left 0.15s, top 0.15s; }
.yes-screen { cursor: pointer; overflow: hidden; }
.turn { font-size: 34px; font-weight: 700; letter-spacing: 6px; text-shadow: 0 3px 0 #c23b4a; animation: pop 0.8s ease-out; }
.turn-sub { font-size: 14px; opacity: 0.85; }
.heart { position: absolute; bottom: -30px; color: #ff6f91; font-size: 22px; animation: float 3.2s linear infinite; }
@keyframes float { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-420px); opacity: 0; } }
</style>
