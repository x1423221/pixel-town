import { reactive, ref, computed } from 'vue'
import { ROUTE, STORAGE_KEY } from '@route'

// ---------- 現在時間（可用網址參數模擬） ----------
// 測試用：網址加 ?now=2026-12-05T20:31:00%2B09:00 就會假裝是那個時間
// （%2B 是 + 號的網址編碼）
const params = new URLSearchParams(location.search)
const fakeNow = params.get('now')
const fakeOffset = fakeNow ? new Date(fakeNow).getTime() - Date.now() : 0

export const isDebug = params.has('debug') || !!fakeNow

// 每秒更新一次，倒數、解鎖會自動跟著變
export const now = ref(Date.now() + fakeOffset)
setInterval(() => { now.value = Date.now() + fakeOffset }, 1000)

// 管理面板用：無視時間鎖（不存檔，重新整理就恢復）
export const ignoreTimeLock = ref(false)

// ---------- 進度：存在手機瀏覽器 ----------
function defaults() {
  return { routeIndex: 0, seen: {}, flags: {}, items: {}, endings: {}, draws: 0, fortune: null }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch (e) { /* 私密瀏覽等情況讀不到，就從頭開始 */ }
  return defaults()
}

const state = reactive(load())

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (e) { /* 存不了也不影響遊玩 */ }
}

export function resetProgress() {
  Object.assign(state, defaults())
  save()
}

// ---------- 路線：目前在第幾區 ----------
export const routeIndex = computed(() => state.routeIndex)

export function goToRoute(i) {
  state.routeIndex = Math.max(0, Math.min(i, ROUTE.length - 1))
  save()
}

// 離某個時間還有幾毫秒，0 代表已經到了（勾了「無視時間鎖」也算到了）
export function msUntil(iso) {
  if (ignoreTimeLock.value) return 0
  return Math.max(0, new Date(iso).getTime() - now.value)
}

// 這一區還要等多久才開（毫秒），0 代表已經開放
export function msUntilUnlock(entry) {
  return msUntil(entry.unlockAt)
}

// ---------- 場景：查過的物件、劇情旗標 ----------
export function isSeen(key) {
  return !!state.seen[key]
}

export function markSeen(key) {
  state.seen[key] = true
  save()
}

export function hasFlag(name) {
  return !!state.flags[name]
}

export function setFlag(name) {
  state.flags[name] = true
  save()
}

export function clearFlag(name) {
  delete state.flags[name]
  save()
}

export function unmarkSeen(key) {
  delete state.seen[key]
  save()
}

// ---------- 道具 ----------
export function hasItem(id) {
  return !!state.items[id]
}

export function addItem(id) {
  state.items[id] = Date.now()
  save()
}

export const itemIds = computed(() => Object.keys(state.items))

// ---------- 抽籤次數、收集到的結局 ----------
export const drawCount = computed(() => state.draws)
export function addDraw() {
  state.draws++
  save()
}

export const endingIds = computed(() => Object.keys(state.endings))
export function addEnding(id) {
  if (!state.endings[id]) state.endings[id] = Date.now()
  save()
}

// ---------- 神社抽到的籤（決定最終章怎麼演） ----------
export const fortune = computed(() => state.fortune)
export function setFortune(rank) {
  state.fortune = rank
  save()
}

// 重新開始：回到第一區、全部重來，只保留收集到的結局和抽籤次數
export function restartGame() {
  Object.assign(state, { ...defaults(), endings: state.endings, draws: state.draws })
  save()
}

// 再玩一次：從神社重新開始，保留收集到的結局和抽籤次數、已經看過的開場白
export function resetForReplay(routeIndex) {
  const keepSeen = Object.fromEntries(Object.entries(state.seen).filter(([k]) => k.endsWith(':intro')))
  Object.assign(state, { ...defaults(), endings: state.endings, draws: state.draws, seen: keepSeen, routeIndex })
  save()
}
