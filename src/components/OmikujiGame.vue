<script setup>
// 抽籤小遊戲（運氣骰）：搖籤筒 → 運勢像骰子一樣轉動、慢慢停下 → 籤棒跳出來 → 打開籤紙
// 不管抽到什麼都可以收下 → emit('take', 那支籤)；抽到的籤決定最終章怎麼演
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  config: { type: Object, required: true },   // koami.js 裡的 omikuji 設定
  message: { type: String, default: '' },     // 他寫在籤背面的話
  drawCount: { type: Number, default: 0 },    // 之前總共抽過幾次
  exclude: { type: Array, default: () => [] }, // 再玩一次時，優先抽還沒看過的結局
})
const emit = defineEmits(['take', 'drew'])

const phase = ref('idle') // idle → rolling → stick → paper
const shown = ref('？')   // 轉動中顯示的運勢
const result = ref(null)
const tries = computed(() => props.drawCount + (phase.value === 'idle' ? 1 : 0))
const boxCanvas = ref(null)
let timers = []

const ranks = computed(() => props.config.fortunes.map((f) => f.rank))
const isWin = computed(() => result.value?.rank === '大吉')
const paperText = computed(() => (result.value ? `${result.value.text}\n\n${props.message}` : ''))

// 依權重隨機抽（排除已經看過結局的籤，全部看過就不排除）
function pick() {
  let list = props.config.fortunes.filter((f) => !props.exclude.includes(f.rank))
  if (!list.length) list = props.config.fortunes
  const total = list.reduce((s, f) => s + f.weight, 0)
  let r = Math.random() * total
  for (const f of list) { r -= f.weight; if (r <= 0) return f }
  return list[0]
}

function shake() {
  if (phase.value !== 'idle') return
  result.value = pick()
  emit('drew')
  phase.value = 'rolling'
  // 運氣骰：一開始轉很快，越轉越慢，最後停在結果
  let delay = 50
  let t = 0
  for (let i = 0; i < 16; i++) {
    t += delay
    const last = i === 15
    timers.push(setTimeout(() => {
      shown.value = last ? result.value.rank : ranks.value[Math.floor(Math.random() * ranks.value.length)]
    }, t))
    delay *= 1.17
  }
  timers.push(setTimeout(() => { phase.value = 'stick' }, t + 500))
  timers.push(setTimeout(() => { phase.value = 'paper' }, t + 1300))
}


// ---------- 籤筒（像素圖） ----------
function drawBox() {
  const c = boxCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  const p = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h) }
  ctx.clearRect(0, 0, c.width, c.height)
  p(4, 2, 16, 40, '#8a5a3a')       // 筒身
  p(4, 2, 3, 40, '#a8744a')
  p(17, 2, 3, 40, '#6a4428')
  p(3, 0, 18, 4, '#5a3a22')        // 上蓋
  p(10, 0, 4, 2, '#1b1e30')        // 出籤的洞
  p(3, 40, 18, 4, '#5a3a22')       // 底
  p(4, 12, 16, 2, '#c9a44a'); p(4, 32, 16, 2, '#c9a44a') // 金色環
  p(8, 16, 8, 14, '#f3efe8')       // 白色貼紙
  p(11, 18, 2, 2, '#c8283a'); p(10, 21, 4, 1, '#c8283a'); p(11, 23, 2, 4, '#c8283a') // 紅字
  p(10, 28, 4, 1, '#c8283a')
}

onMounted(drawBox)
watch(phase, async () => { await nextTick(); drawBox() }) // 籤筒重新出現時要再畫一次
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="omikuji">
    <p class="head">抽籤　第 {{ tries }} 次</p>

    <!-- 運氣骰 -->
    <div class="dice" :class="{ rolling: phase === 'rolling', landed: phase !== 'idle' && phase !== 'rolling', win: isWin && phase !== 'rolling' }">
      {{ shown }}
    </div>

    <!-- 籤筒＋跳出來的籤棒 -->
    <div v-if="phase !== 'paper'" class="box-area">
      <div v-if="phase === 'stick'" class="stick"><span>第{{ (tries * 7) % 50 + 1 }}番</span></div>
      <canvas ref="boxCanvas" width="24" height="44" class="box" :class="{ shaking: phase === 'rolling' }" />
    </div>

    <!-- 籤紙 -->
    <div v-else class="paper" :class="{ win: isWin }">
      <p class="rank">{{ result.rank }}</p>
      <p class="text">{{ paperText }}</p>
    </div>

    <button v-if="phase === 'idle'" class="btn" @pointerdown.prevent="shake">搖一搖！</button>
    <button v-else-if="phase === 'paper'" class="btn" :class="{ win: isWin }" @pointerdown.prevent="emit('take', result)">收下這支籤</button>
  </div>
</template>

<style scoped>
.omikuji {
  position: absolute; inset: 0; z-index: 6; background: rgba(12, 16, 36, 0.9); color: #f3efe8;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 16px;
}
.head { font-size: 13px; letter-spacing: 3px; opacity: 0.8; }
.dice {
  min-width: 112px; padding: 6px 14px; text-align: center; font-size: 30px; font-weight: 700; letter-spacing: 6px;
  background: #fbf7ee; color: #1b2140; border: 4px solid #c8283a; box-shadow: 0 4px 0 #8e1a2a;
}
.dice.rolling { animation: jitter 0.12s steps(2) infinite; }
.dice.landed { animation: pop 0.35s ease-out; }
.dice.win { background: #ffd166; color: #c8283a; border-color: #fff; }
.box-area { position: relative; height: 210px; display: flex; align-items: flex-end; justify-content: center; }
.box { width: 96px; height: 176px; image-rendering: pixelated; transform-origin: 50% 90%; }
.box.shaking { animation: shake 0.16s ease-in-out infinite; }
.stick {
  position: absolute; top: 0; left: 50%; width: 12px; height: 80px; margin-left: -6px; background: #e8d4a8;
  border: 2px solid #8a6a3a; animation: rise 0.5s ease-out both; display: flex; justify-content: center;
}
.stick span { writing-mode: vertical-rl; font-size: 10px; color: #8a3a2a; margin-top: 6px; }
.paper {
  width: 76%; min-height: 210px; background: #fbf7ee; color: #1b2140; border-top: 8px solid #c8283a; border-bottom: 8px solid #c8283a;
  padding: 14px 16px; text-align: center; animation: unfold 0.5s ease-out both; transform-origin: top;
}
.paper.win { box-shadow: 0 0 0 4px #ffd166; }
.rank { font-size: 40px; font-weight: 700; color: #c8283a; letter-spacing: 8px; margin-bottom: 10px; }
.text { font-size: 15px; line-height: 1.8; white-space: pre-line; }
.btn {
  font: inherit; font-size: 17px; font-weight: 700; padding: 10px 26px; cursor: pointer;
  background: #c8283a; color: #fff; border: 4px solid #f3efe8; box-shadow: 0 4px 0 #8e1a2a;
}
.btn.win { background: #ffd166; color: #8e1a2a; }
.btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #8e1a2a; }
@keyframes shake { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg) translateY(-6px); } }
@keyframes jitter { 50% { transform: translateY(-3px); } }
@keyframes pop { 0% { transform: scale(0.6); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
@keyframes rise { from { transform: translateY(90px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes unfold { from { transform: scaleY(0.05); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
</style>
