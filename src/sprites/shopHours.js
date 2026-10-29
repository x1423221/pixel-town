// 營業時間：場景設定 shopHours 的區域（阿美橫町），店會依日本時間開店、收攤
//   早上 9:00～10:30 之間一家一家拉起鐵捲門
//   傍晚 18:00～20:00 之間一家一家拉下鐵捲門（每家花 15 分鐘慢慢拉）
//   劇情需要的人（always: true）的攤位一直開著
import { hash } from './sceneArt.js'
import { light } from './daylight.js'

const TILE = 24
const SLIDE = 0.25 // 拉鐵捲門要花幾小時（15 分鐘）

// 這一格的鐵捲門拉下多少：0 = 全開、1 = 全關
export function shutterLevel(scene, tx, h = light.hour) {
  if (!scene.shopHours) return 0
  if (scene.station && tx >= scene.station.x) return 0
  if (keepOpen(scene).has(tx)) return 0
  const th = hash(tx, 77)
  const openAt = 9 + th * 1.5
  const closeAt = 18 + th * 2
  if (h < openAt) return 1
  if (h < openAt + SLIDE) return 1 - (h - openAt) / SLIDE
  if (h < closeAt) return 0
  if (h < closeAt + SLIDE) return (h - closeAt) / SLIDE
  return 1
}

// 劇情需要的人站的那幾格（一直開著）
const keepCache = new WeakMap()
function keepOpen(scene) {
  if (!keepCache.has(scene)) {
    keepCache.set(scene, new Set(scene.objects.filter((o) => o.always && o.inStall).map((o) => Math.round(o.x))))
  }
  return keepCache.get(scene)
}

// 現在是哪個時段：early 還沒開／open 營業中／closing 收攤中／closed 打烊
export function shopPhase(h = light.hour) {
  if (h < 5 || h >= 20) return 'closed'
  if (h < 10) return 'early'
  if (h < 18) return 'open'
  return 'closing'
}

// 開著的店佔多少（用來決定街上人潮多寡）
function openRatio(scene) {
  let n = 0, open = 0
  for (let tx = 0; tx < scene.width; tx++) {
    if (scene.station && tx >= scene.station.x) continue
    n++; open += 1 - shutterLevel(scene, tx)
  }
  return n ? open / n : 1
}

const seed = (id) => [...String(id)].reduce((s, c) => s + c.charCodeAt(0) * 7, 0)

// 這個人現在在不在場
export function isPresent(scene, a) {
  if (!scene.shopHours || a.always) return true
  const tx = Math.floor((a.x + 12) / TILE)
  if (a.inStall) return shutterLevel(scene, tx) < 0.5 // 攤位關了，店員就不在
  if (a.shop) return shutterLevel(scene, tx) === 0     // 店開著才有人在挑東西
  if (a.walk && !a.lines) return hash(seed(a.id), 3) < 0.3 + 0.7 * openRatio(scene) // 背景人潮依開店數量增減
  return true
}

// 依時段換台詞：phaseLines: { early: [...], closing: [...], closed: [...] }
export function linesFor(a) {
  return a.phaseLines?.[shopPhase()] || a.lines
}
