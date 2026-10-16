// 像素煙火：從下面升上去 → 炸開 → 慢慢往下飄、變暗
// 用法：const fw = createFireworks(); 每一幀 fw.update(dt, 要不要繼續放)；fw.draw(ctx)
const COLORS = [
  ['#ff6f91', '#ffc2d1'], ['#ffd166', '#fff2c8'], ['#7ad7ff', '#d8f4ff'],
  ['#9adf7a', '#e0ffd0'], ['#c49aff', '#efe2ff'], ['#ff8a5a', '#ffd8c4'],
]

export function createFireworks({ width = 192, top = 14, bottom = 80, launchY = 96 } = {}) {
  const bursts = []
  let wait = 0

  function spawn(big = false) {
    const [c1, c2] = COLORS[Math.floor(Math.random() * COLORS.length)]
    const n = big ? 36 : 24 + Math.floor(Math.random() * 8)
    bursts.push({
      x: 16 + Math.random() * (width - 32),
      y: top + Math.random() * (bottom - top),
      t: 0,
      rise: 500 + Math.random() * 300,
      speed: (big ? 58 : 40) + Math.random() * 12, // 炸開的速度（像素／秒）
      parts: Array.from({ length: n }, (_, i) => ({ a: (i / n) * Math.PI * 2 + Math.random() * 0.2, v: 0.75 + Math.random() * 0.35 })),
      c1, c2,
    })
  }

  return {
    // active：還要不要繼續發射新的煙火
    update(dt, active) {
      if (active) {
        wait -= dt
        if (wait <= 0) {
          spawn(Math.random() < 0.25)
          if (Math.random() < 0.4) spawn() // 有時候一次兩發
          wait = 250 + Math.random() * 450
        }
      }
      bursts.forEach((b) => { b.t += dt })
      for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].t > bursts[i].rise + 2000) bursts.splice(i, 1)
    },

    draw(ctx) {
      bursts.forEach((b) => {
        if (b.t < b.rise) { // 往上升的火光
          const k = b.t / b.rise
          const y = launchY + (b.y - launchY) * k
          ctx.fillStyle = '#fff2c8'
          ctx.fillRect(Math.round(b.x), Math.round(y), 1, 3)
          ctx.fillStyle = '#ffb070'
          ctx.fillRect(Math.round(b.x), Math.round(y) + 3, 1, 2)
          return
        }
        const s = (b.t - b.rise) / 1000 // 炸開後經過幾秒
        const r = b.speed * (1 - Math.exp(-s * 2.2)) // 越往外越慢
        const drop = s * s * 6                       // 慢慢往下飄
        const fade = s < 0.9 ? 1 : Math.max(0, 1 - (s - 0.9) / 1.1)
        if (fade <= 0) return
        ctx.globalAlpha = fade
        if (s < 0.15) { // 剛炸開的閃光
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 5, 5)
        }
        b.parts.forEach((p, i) => {
          const x = Math.round(b.x + Math.cos(p.a) * r * p.v)
          const y = Math.round(b.y + Math.sin(p.a) * r * p.v + drop)
          ctx.fillStyle = s < 0.5 ? b.c2 : b.c1
          ctx.fillRect(x, y, 2, 2)
          if (s < 1.2) { // 拖尾
            ctx.fillStyle = b.c1
            for (const k of [0.82, 0.66]) {
              ctx.fillRect(Math.round(b.x + Math.cos(p.a) * r * p.v * k), Math.round(b.y + Math.sin(p.a) * r * p.v * k + drop), 1, 1)
            }
          }
        })
        ctx.globalAlpha = 1
      })
    },
  }
}
