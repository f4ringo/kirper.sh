<template>
  <div
    class="avatar"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: color,
      transition: isMoving ? 'none' : 'all 0.3s ease-out'
    }"
  >
    <div class="avatar-circle"></div>
    <div class="avatar-name">{{ username }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  username: string;
  x: number;
  y: number;
  color: string;
  isMoving?: boolean;
}>();

// Computed properties for positioning
const x = computed(() => props.x);
const y = computed(() => props.y);
</script>

<style scoped>
.avatar {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: v-bind(color);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-name {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100px;
  overflow: hidden;
}
</style> 