<script setup>
// 仿掌機控制區：左邊十字鍵、右邊 A 鍵
// 按住方向鍵 → press(dir)，放開 → release(dir)
const emit = defineEmits(['press', 'release', 'a'])

const dirs = ['up', 'left', 'right', 'down']

function down(e, dir) {
  e.preventDefault()
  e.currentTarget.setPointerCapture?.(e.pointerId)
  emit('press', dir)
}
function up(e, dir) {
  e.preventDefault()
  emit('release', dir)
}
</script>

<template>
  <div class="pad">
    <div class="dpad">
      <button
        v-for="d in dirs"
        :key="d"
        :class="['key', d]"
        :aria-label="d"
        @pointerdown="down($event, d)"
        @pointerup="up($event, d)"
        @pointercancel="up($event, d)"
        @contextmenu.prevent
      >
        <span class="arrow" />
      </button>
      <span class="center" />
    </div>

    <button class="a" aria-label="A" @pointerdown.prevent="emit('a')" @contextmenu.prevent>A</button>
  </div>
</template>

<style scoped>
.pad {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px 4px; touch-action: none; user-select: none; -webkit-user-select: none;
}
.dpad { position: relative; width: 105px; height: 105px; }
.key, .center {
  position: absolute; width: 35px; height: 35px; background: #2b2f4a; border: none;
}
.key { cursor: pointer; padding: 0; touch-action: none; }
.key:active { background: #3e4468; }
.up { left: 35px; top: 0; border-radius: 6px 6px 0 0; }
.down { left: 35px; bottom: 0; border-radius: 0 0 6px 6px; }
.left { left: 0; top: 35px; border-radius: 6px 0 0 6px; }
.right { right: 0; top: 35px; border-radius: 0 6px 6px 0; }
.center { left: 35px; top: 35px; }
.arrow { display: block; width: 0; height: 0; margin: auto; border: 7px solid transparent; }
.up .arrow { border-bottom-color: #8a90b0; margin-top: 5px; }
.down .arrow { border-top-color: #8a90b0; margin-top: 16px; }
.left .arrow { border-right-color: #8a90b0; margin-left: 5px; }
.right .arrow { border-left-color: #8a90b0; margin-left: 16px; }
.a {
  width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
  background: #c23b4a; color: #f3efe8; font: inherit; font-size: 20px; font-weight: 700;
  box-shadow: 0 4px 0 #8e1a2a; touch-action: none;
}
.a:active { transform: translateY(3px); box-shadow: 0 1px 0 #8e1a2a; }
</style>
