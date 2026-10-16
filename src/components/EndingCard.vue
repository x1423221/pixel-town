<script setup>
// 結局畫面
//   真結局（求婚完成）：兩個人站在一起＋最後的話
//   其他結局（抽到大吉以外的籤）：找到他了、兩個人站在一起，但他沒說出口；最後淡淡出現提示和「回到神社」
import { computed } from 'vue'
import PixelSprite from './PixelSprite.vue'

const props = defineProps({
  ending: { type: Object, required: true }, // { title, lines, rank?, hint? }
  isTrue: { type: Boolean, default: false },
  collected: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['title-tap', 'retry'])

// 每行字一個一個淡出，結局收集數和提示排在最後
const lineDelay = (i) => `${0.6 + i * 1.1}s`
const afterLines = computed(() => 0.6 + props.ending.lines.length * 1.1)
</script>

<template>
  <section class="ending" :class="{ bad: !isTrue }">
    <p v-if="!isTrue" class="label">結局・{{ ending.rank }}</p>
    <h1 class="title" @click="emit('title-tap')">{{ ending.title }}</h1>

    <div class="stage">
      <template v-if="isTrue">
        <PixelSprite character="boy" :scale="4" />
        <span class="heart">♥</span>
        <PixelSprite character="girl" :scale="4" />
      </template>
      <template v-else>
        <PixelSprite character="boy" :scale="4" />
        <span class="dots">…</span>
        <PixelSprite character="girl" :scale="4" />
      </template>
    </div>

    <p v-for="(line, i) in ending.lines" :key="i" class="line" :style="{ animationDelay: lineDelay(i) }">{{ line }}</p>

    <p v-if="total" class="count" :style="{ animationDelay: `${afterLines + 0.4}s` }">結局收集　{{ collected }} / {{ total }}</p>

    <template v-if="!isTrue">
      <p class="hint" :style="{ animationDelay: `${afterLines + 2}s` }">{{ ending.hint }}</p>
      <button class="retry" :style="{ animationDelay: `${afterLines + 3.2}s` }" @click="emit('retry')">回到神社，再抽一次</button>
    </template>
  </section>
</template>

<style scoped>
.ending { max-width: 420px; margin: 0 auto; padding: 40px 12px; text-align: center; display: grid; gap: 16px; justify-items: center; }
.label { font-size: 13px; letter-spacing: 4px; opacity: 0.7; }
.title { font-size: 24px; letter-spacing: 6px; color: #ffd166; user-select: none; }
.bad .title { color: #c8d0f0; }
.stage { display: flex; align-items: flex-end; gap: 10px; margin: 12px 0; }
.dots { color: #a8b0d8; font-size: 24px; margin-bottom: 40px; }
.heart { color: #ff6f91; font-size: 32px; animation: beat 1s ease-in-out infinite; margin-bottom: 40px; }
.line, .count, .hint, .retry { opacity: 0; animation: show 1s ease-out forwards; }
.line { font-size: 17px; line-height: 1.8; }
.count { font-size: 13px; letter-spacing: 3px; color: #ffd166; margin-top: 8px; }
.hint { font-size: 14px; opacity: 0; color: #a8b0d8; font-style: italic; animation-name: whisper; animation-duration: 2s; }
.retry {
  font: inherit; font-size: 15px; padding: 8px 22px; cursor: pointer; margin-top: 4px;
  background: transparent; color: #f3efe8; border: 2px solid #f3efe8;
}
@keyframes beat { 50% { transform: scale(1.25); } }
@keyframes show { to { opacity: 1; } }
@keyframes whisper { to { opacity: 0.85; } }
</style>
