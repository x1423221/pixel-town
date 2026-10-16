<script setup>
// 回憶畫面（閃回）：一段一段播，每段有背景、人物、對話
// 資料寫在場景檔裡（例如 ueno.js 的 flashback），格式：
//   { title, shots: [{ bg, caption, cast: [{ who, x, from?, facing }], props: [...], lines: ['他：……', '（旁白）'] }] }
//   lines 開頭寫「他：」「她：」會顯示名字，其他就是旁白
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { FB_W, FB_H, FEET, drawBackdrop, drawForeground, smallCandy, agedCanvas } from '../sprites/flashbackArt.js'
import { createFireworks } from '../sprites/fireworks.js'
import { boyCanvas, girlCanvas } from '../sprites/sceneArt.js'

const props = defineProps({ flashback: { type: Object, required: true } })
const emit = defineEmits(['done'])

const canvas = ref(null)
const st = reactive({ shot: 0, phase: 'fadein', t: 0, line: 0, shown: 0 })
let cast = []
let raf = 0, last = 0, clock = 0, typeClock = 0
const fireworks = createFireworks({ width: 192, top: 12, bottom: 50, launchY: 120 }) // 畫的時候縮成一半

const shot = computed(() => props.flashback.shots[st.shot])
const parsed = computed(() => {
  const raw = shot.value.lines[st.line] || ''
  const m = raw.match(/^(他|她)：(.*)$/)
  return m ? { name: m[1], text: m[2] } : { name: '', text: raw }
})
const lineDone = computed(() => st.shown >= parsed.value.text.length)

function setupShot() {
  cast = (shot.value.cast || []).map((c) => ({ ...c, cx: c.from ?? c.x, step: 0, stepClock: 0 }))
  Object.assign(st, { phase: 'fadein', t: 0, line: 0, shown: 0 })
}

function update(dt) {
  st.t += dt
  if (st.phase === 'fadein' && st.t > 700) Object.assign(st, { phase: 'walk', t: 0 })
  if (st.phase === 'walk') {
    let moving = false
    cast.forEach((c) => {
      if (c.cx === c.x) return
      moving = true
      const d = c.x - c.cx
      c.cx = Math.abs(d) < 0.6 ? c.x : c.cx + Math.sign(d) * 0.6 * (dt / 16)
      if ((d > 0 && c.cx > c.x) || (d < 0 && c.cx < c.x)) c.cx = c.x
      c.stepClock += dt
      if (c.stepClock > 200) { c.stepClock = 0; c.step = 1 - c.step }
    })
    if (!moving) Object.assign(st, { phase: 'talk', t: 0, shown: 0 })
  }
  if (st.phase === 'talk' && !lineDone.value) {
    typeClock += dt
    while (typeClock > 45 && !lineDone.value) { typeClock -= 45; st.shown++ }
  }
  if (st.phase === 'fadeout' && st.t > 800) {
    if (st.shot < props.flashback.shots.length - 1) { st.shot++; setupShot() } else { st.phase = 'end'; emit('done') }
  }
}

function drawChar(ctx, c) {
  const walking = c.cx !== c.x
  const facing = walking ? (c.x > c.cx ? 'right' : 'left') : (c.facing || 'right')
  const frame = walking ? c.step : Math.floor(clock / 600) % 2
  let img = c.who === 'boy' ? boyCanvas(walking ? 'side-walk' : 'side-idle', frame) : girlCanvas(facing, walking, frame)
  if (c.old) img = agedCanvas(img, `${c.who}-${walking}-${frame}`)
  const x = Math.round(c.cx), y = FEET - img.height
  if (facing === 'left') {
    ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore()
  } else ctx.drawImage(img, x, y)
  return { x, facing }
}

function visible(pr) {
  const i = st.phase === 'talk' ? st.line : st.phase === 'fadeout' || st.phase === 'end' ? Infinity : -1
  if (pr.from != null && i < pr.from) return false
  if (pr.until != null && i >= pr.until) return false
  return true
}

function render() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  drawBackdrop(ctx, shot.value.bg, clock)
  if (shot.value.fireworks) { ctx.save(); ctx.scale(0.5, 0.5); fireworks.draw(ctx); ctx.restore() }
  const pos = {}
  cast.forEach((c) => { pos[c.who] = drawChar(ctx, c) })
  drawForeground(ctx, shot.value.bg, clock)
  ;(shot.value.props || []).forEach((pr) => {
    if (!visible(pr)) return
    if (pr.at) return smallCandy(ctx, pr.at[0], pr.at[1])
    const h = pos[pr.on]
    if (h) smallCandy(ctx, h.facing === 'left' ? h.x - 2 : h.x + 18, FEET - 18)
  })
}

function loop(t) {
  const dt = last ? Math.min(t - last, 50) : 16
  last = t
  clock += dt
  update(dt)
  fireworks.update(dt, !!shot.value.fireworks)
  render()
  raf = requestAnimationFrame(loop)
}

// 點畫面／按 A：字還沒跑完就先全部顯示，跑完了就下一句
function advance() {
  if (st.phase === 'walk') { cast.forEach((c) => { c.cx = c.x }); return }
  if (st.phase !== 'talk') return
  if (!lineDone.value) { st.shown = parsed.value.text.length; return }
  if (st.line < shot.value.lines.length - 1) { st.line++; st.shown = 0; typeClock = 0 } else Object.assign(st, { phase: 'fadeout', t: 0 })
}
defineExpose({ advance })

onMounted(() => { setupShot(); raf = requestAnimationFrame(loop) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="flashback" @pointerdown.prevent="advance">
    <canvas ref="canvas" :width="FB_W" :height="FB_H" class="art" :class="{ future: flashback.future, dim: st.phase === 'fadein' || st.phase === 'fadeout' || st.phase === 'end' }" />
    <div class="vignette" :class="{ future: flashback.future }" />
    <p class="label">{{ flashback.future ? '未來' : '回憶' }}・{{ flashback.title }}</p>
    <p v-if="shot.caption" :key="st.shot" class="caption" :class="{ night: ['harborOld', 'living'].includes(shot.bg) }">{{ shot.caption }}</p>
    <div v-if="st.phase === 'talk'" class="box">
      <p v-if="parsed.name" class="name">{{ parsed.name }}</p>
      <p class="text" :class="{ narr: !parsed.name }">{{ parsed.text.slice(0, st.shown) }}</p>
      <span v-if="lineDone" class="next">▼</span>
    </div>
  </div>
</template>

<style scoped>
.flashback { position: absolute; inset: 0; z-index: 7; background: #f6efe2; cursor: pointer; overflow: hidden; }
.art {
  display: block; width: 100%; height: 100%; image-rendering: pixelated;
  filter: sepia(0.28) saturate(0.95) brightness(1.03); transition: opacity 0.7s ease;
}
.art.dim { opacity: 0; }
.art.future { filter: saturate(0.9) brightness(1.04); }
.vignette.future { box-shadow: inset 0 0 60px 24px rgba(236, 232, 255, 0.85); }
.vignette { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 60px 24px rgba(255, 246, 228, 0.85); }
.label {
  position: absolute; top: 10px; left: 12px; font-size: 12px; letter-spacing: 3px; color: #8a6a4a;
  background: rgba(255, 250, 240, 0.8); padding: 3px 8px;
}
.caption {
  position: absolute; top: 40px; left: 0; right: 0; text-align: center; font-size: 15px; letter-spacing: 2px;
  color: #5a4434; text-shadow: 0 0 6px #fff8ec, 0 0 2px #fff8ec; animation: cap 3.2s ease forwards;
}
.box {
  position: absolute; left: 10px; right: 10px; bottom: 12px; min-height: 26%; padding: 12px 14px;
  background: rgba(255, 251, 243, 0.94); border: 3px solid #8a6a4a; color: #3a2a20;
}
.name { font-size: 13px; color: #b0504a; font-weight: 700; margin-bottom: 4px; }
.caption.night { color: #f3efe8; text-shadow: 0 0 6px #1b2140, 0 0 2px #1b2140; }
.text { font-size: 16px; line-height: 1.7; white-space: pre-line; }
.text.narr { color: #7a6250; font-style: italic; }
.next { position: absolute; right: 10px; bottom: 6px; font-size: 12px; color: #8a6a4a; animation: blink 0.8s steps(2) infinite; }
@keyframes cap { 0% { opacity: 0; transform: translateY(6px); } 15%, 75% { opacity: 1; transform: none; } 100% { opacity: 0.0; } }
@keyframes blink { 50% { opacity: 0; } }
</style>
