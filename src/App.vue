<script setup>
import { ref, computed } from 'vue'
import SceneView from './components/SceneView.vue'
import StationCard from './components/StationCard.vue'
import EndingCard from './components/EndingCard.vue'
import { ROUTE } from '@route'
import {
  routeIndex, goToRoute, msUntilUnlock, ignoreTimeLock, resetProgress, isDebug, now, hasFlag, setFlag,
  addEnding, endingIds, unmarkSeen, isSeen, clearFlag,
} from './composables/useProgress.js'

// 流程：轉場畫面（下一站）→ 按「出發」→ 場景 → 走到出口 → 下一區的轉場畫面……
const showCard = ref(true) // 一打開先顯示轉場畫面，當作開場
const sceneKey = ref(0)    // 換區或重置時用來重建場景

const entry = computed(() => ROUTE[routeIndex.value])
const msLeft = computed(() => (now.value, msUntilUnlock(entry.value)))
const cardMode = computed(() => {
  if (msLeft.value > 0) return 'locked'
  if (!entry.value.scene) return 'wip'
  return 'next'
})

function depart() {
  showCard.value = false
  sceneKey.value++
}

// ---------- 結局 ----------
// 有最終章的那一區（試玩版沒有）
const lastScene = ROUTE.map((r) => r.scene).find((s) => s?.finale)
const variants = lastScene?.finale.variants || {}
const totalEndings = Object.keys(variants).length

// 真結局（大吉 → 求婚完成）：之後打開都直接看到結尾畫面
const finished = computed(() => hasFlag('proposed'))
const trueEnding = variants['大吉'] ? { rank: '大吉', ...variants['大吉'].ending } : null
function onFinaleDone() {
  addEnding('大吉')
  setFlag('proposed')
}

// 其他籤的結局：找到他了，但他沒說出口
const routeEnding = ref(null)
function onRouteEnding(e) {
  addEnding(e.rank)
  routeEnding.value = e
}
// 回到神社重抽：巫女那邊再搖一次籤，收下之後直接跳到碼頭
const shrineIndex = ROUTE.findIndex((r) => r.scene?.objects?.some((o) => o.omikuji))
function retryShrine() {
  const miko = ROUTE[shrineIndex].scene.objects.find((o) => o.omikuji)
  unmarkSeen(`${ROUTE[shrineIndex].id}:${miko.id}`) // 讓放大鏡重新出現在巫女身上
  if (miko.setFlag) clearFlag(miko.setFlag) // 正殿先鎖起來，一定要先重抽
  setFlag('redraw')
  goToRoute(shrineIndex)
  routeEnding.value = null
  showCard.value = false
  sceneKey.value++
}

function onSceneExit() {
  // 重抽完：直接跳到最終章的碼頭（不用再走一次芝公園、海洋）
  if (lastScene && routeIndex.value === shrineIndex && isSeen(`${lastScene.id}:waiting`)) {
    goToRoute(ROUTE.length - 1)
    showCard.value = false
    sceneKey.value++
    return
  }
  if (routeIndex.value < ROUTE.length - 1) goToRoute(routeIndex.value + 1)
  showCard.value = true
}

// ---------- 後門：連點標題 5 下打開管理面板 ----------
const showAdmin = ref(isDebug)
let taps = 0
let tapTimer = null
function onTitleTap() {
  taps++
  clearTimeout(tapTimer)
  tapTimer = setTimeout(() => { taps = 0 }, 1500)
  if (taps >= 5) { showAdmin.value = !showAdmin.value; taps = 0 }
}

function jumpTo(i) {
  goToRoute(i)
  showCard.value = true
}

function restart() {
  resetProgress()
  routeEnding.value = null
  showCard.value = true
  sceneKey.value++
}

function fmtNow() {
  return new Date(now.value).toLocaleString('zh-TW', { timeZone: 'Asia/Tokyo', hour12: false }) + '（日本）'
}
</script>

<template>
  <main class="page">
    <EndingCard
      v-if="routeEnding"
      :ending="routeEnding"
      :collected="endingIds.length"
      :total="totalEndings"
      @retry="retryShrine"
      @title-tap="onTitleTap"
    />
    <EndingCard
      v-else-if="finished && trueEnding"
      :ending="trueEnding"
      is-true
      :collected="endingIds.length"
      :total="totalEndings"
      @title-tap="onTitleTap"
    />
    <StationCard
      v-else-if="showCard || !entry.scene"
      :entry="entry"
      :mode="cardMode"
      :ms-left="msLeft"
      @go="depart"
      @title-tap="onTitleTap"
    />
    <SceneView
      v-else
      :key="`${entry.id}-${sceneKey}`"
      :scene="entry.scene"
      @title-tap="onTitleTap"
      @exit="onSceneExit"
      @finale-done="onFinaleDone"
      @route-ending="onRouteEnding"
    />

    <aside v-if="showAdmin" class="admin">
      <p>管理面板・{{ fmtNow() }}</p>
      <div class="row">
        <button v-for="(r, i) in ROUTE" :key="r.id" :class="{ on: i === routeIndex }" @click="jumpTo(i)">
          跳到{{ r.title }}
        </button>
      </div>
      <label class="check">
        <input v-model="ignoreTimeLock" type="checkbox" />
        無視時間鎖（測試用）
      </label>
      <button @click="restart">重置進度並重新開始</button>
    </aside>
  </main>
</template>

<style scoped>
.page { max-width: 480px; margin: 0 auto; padding: 20px 12px 32px; }
.admin { margin-top: 24px; padding: 12px; border: 2px dashed #ff6f91; font-size: 13px; display: grid; gap: 8px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.admin button { font: inherit; padding: 6px 8px; background: transparent; color: inherit; border: 1px solid currentColor; cursor: pointer; }
.admin button.on { background: #f3efe8; color: #1b2140; }
.check { display: flex; gap: 6px; align-items: center; }
</style>
