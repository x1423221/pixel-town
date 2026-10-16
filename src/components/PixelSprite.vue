<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { CHARACTERS } from '../sprites/characters.js'

const props = defineProps({
  character: { type: String, required: true }, // 'boy' | 'girl'
  pose: { type: String, default: 'idle' },      // boy: idle/walk/kneel；girl: idle/walk/surprise
  scale: { type: Number, default: 4 },           // 每一格像素放大幾倍
  animated: { type: Boolean, default: true },
  speed: { type: Number, default: 550 },         // 換幀間隔（毫秒）
  flip: { type: Boolean, default: false },       // 左右翻轉（往左走時用）
})

const canvas = ref(null)
let frame = 0
let timer = null

function render() {
  const draw = CHARACTERS[props.character]
  if (!draw || !canvas.value) return
  const { w, h, pixels } = draw(props.pose, frame)
  const el = canvas.value
  el.width = w
  el.height = h
  el.style.width = w * props.scale + 'px'
  el.style.height = h * props.scale + 'px'
  const ctx = el.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  pixels.forEach((color, i) => {
    if (!color) return
    ctx.fillStyle = color
    ctx.fillRect(i % w, Math.floor(i / w), 1, 1)
  })
}

function start() {
  stop()
  if (!props.animated) return
  timer = setInterval(() => {
    frame ^= 1
    render()
  }, props.speed)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

onMounted(() => { render(); start() })
onBeforeUnmount(stop)
watch(() => [props.character, props.pose, props.scale], render)
watch(() => [props.animated, props.speed], start)
</script>

<template>
  <canvas ref="canvas" class="pixel-sprite" :style="{ transform: flip ? 'scaleX(-1)' : 'none' }" />
</template>

<style scoped>
.pixel-sprite {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
}
</style>
