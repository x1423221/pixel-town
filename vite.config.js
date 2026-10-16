import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// 兩個版本共用同一份程式，只差在讀哪一份路線：
//   npm run build        → 正式版（東京），輸出到 dist/
//   npm run build:demo   → 試玩版（像素小鎮），輸出到 dist-demo/
//   試玩版只會打包小鎮的內容，東京、回憶、求婚的資料完全不會出現在試玩版的檔案裡
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@route': fileURLToPath(new URL(mode === 'demo' ? './src/data/demo/route.js' : './src/data/scenes/index.js', import.meta.url)),
    },
  },
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
}))
