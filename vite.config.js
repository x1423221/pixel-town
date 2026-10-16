import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// npm run dev     在電腦上開來玩
// npm run build   打包到 dist/
// （試玩版已經搬到另一個儲存庫 test_town，這裡只放正式版）
export default defineConfig({
  base: './', // 用相對路徑，放在子資料夾也能正常讀到檔案
  plugins: [vue()],
  resolve: {
    alias: { '@route': fileURLToPath(new URL('./src/data/scenes/index.js', import.meta.url)) },
  },
})
