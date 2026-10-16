// 整趟旅程的路線：依序一區一區玩下去
//   id        區域代號（存進度用，不要隨便改）
//   title     轉場畫面上顯示的名字
//   unlockAt  幾點以後才能進這一區（時間一律寫時區，+09:00 是日本時間）
//   scene     場景內容；還沒做的區域先留空，會顯示「製作中」
import ueno from './ueno.js'
import koami from './koami.js'
import shiba from './shiba.js'
import sea from './sea.js'

// 遊戲名稱（標題列、瀏覽器分頁都會顯示）；存檔的名字
export const GAME_TITLE = '東京任務'
export const STORAGE_KEY = 'tokyo-mission-progress-v2'

export const ROUTE = [
  { id: 'ueno', title: '阿美橫町', unlockAt: '2026-12-04T06:30:00+09:00', scene: ueno },
  { id: 'koami', title: '小網神社', unlockAt: '2026-12-04T06:30:00+09:00', scene: koami },
  { id: 'shiba', title: '芝公園', unlockAt: '2026-12-04T15:00:00+09:00', scene: shiba }, // 配合 16:00 到芝公園
  { id: 'sea', title: '海洋', unlockAt: '2026-12-05T05:00:00+09:00', scene: sea },
]
