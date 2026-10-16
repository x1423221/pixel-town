// 試玩版的路線（npm run build:demo 才會用到）
// 只有一個虛構的「像素小鎮」，不提東京、煙火、回憶和求婚
import town from './town.js'

export const GAME_TITLE = '像素小鎮'
export const STORAGE_KEY = 'pixel-town-demo-v1'

export const ROUTE = [
  { id: 'town', title: '像素小鎮', unlockAt: '2000-01-01T00:00:00+09:00', scene: town },
  {
    id: 'soon', title: '？？？', unlockAt: '2000-01-01T00:00:00+09:00', scene: null,
    // 玩完小鎮之後看到的畫面
    message: ['試玩到這裡結束，謝謝妳！', '真正的故事，要等到某一天才會開始。', '到時候，記得把手機充飽電喔。'],
  },
]
