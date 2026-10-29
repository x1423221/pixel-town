// 打包後加密：把整個遊戲（JS＋CSS）用密碼加密成 dist/game.enc，
// 再把 dist/index.html 換成「輸入密碼」的畫面。沒有密碼的人只拿得到一團亂碼。
//
// 用法：GAME_PASSWORD=你的密碼 npm run build
//   密碼不要寫進任何檔案裡（GitHub 上設定成 Secret，見 .github/workflows/deploy.yml）
//   沒有設定 GAME_PASSWORD 的話就不加密（在自己電腦上測試用）
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { webcrypto as crypto } from 'node:crypto'
import { join } from 'node:path'

const DIST = 'dist'
// 不分大小寫、前後空白不算（大寫小寫都可以打開）
const password = process.env.GAME_PASSWORD?.trim().toUpperCase()
if (!password) {
  console.log('（沒有設定 GAME_PASSWORD，這次不加密）')
  process.exit(0)
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const jsPath = html.match(/<script[^>]*src="\.\/([^"]+\.js)"/)[1]
const cssPath = html.match(/<link[^>]*rel="stylesheet"[^>]*href="\.\/([^"]+\.css)"/)?.[1]
const payload = JSON.stringify({
  js: readFileSync(join(DIST, jsPath), 'utf8'),
  css: cssPath ? readFileSync(join(DIST, cssPath), 'utf8') : '',
  title: (html.match(/<title>(.*?)<\/title>/) || [])[1] || '',
})

// 密碼 → 金鑰（PBKDF2，算 25 萬次，讓猜密碼變得很慢）→ AES-GCM 加密
const ITER = 250000
const salt = crypto.getRandomValues(new Uint8Array(16))
const iv = crypto.getRandomValues(new Uint8Array(12))
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(payload)))
const b64 = (u8) => Buffer.from(u8).toString('base64')
writeFileSync(join(DIST, 'game.enc'), JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) }))

// 原本沒加密的檔案刪掉
unlinkSync(join(DIST, jsPath))
if (cssPath) unlinkSync(join(DIST, cssPath))

// 換成密碼畫面
writeFileSync(join(DIST, 'index.html'), readFileSync('scripts/lock.html', 'utf8'))
console.log(`已加密：${jsPath}${cssPath ? '、' + cssPath : ''} → game.enc`)
