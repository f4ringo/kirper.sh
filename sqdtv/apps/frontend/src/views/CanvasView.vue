<template>
  <div class="h-[calc(100vh-4rem)]">
    <div class="bg-white shadow-sm rounded-lg h-full">
      <div class="p-4 border-b">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900">Collaborative Canvas</h2>
          <div class="space-x-2">
            <div v-if="!isConnected" class="flex items-center space-x-2">
              <input 
                v-model="inputUsername" 
                type="text" 
                placeholder="Enter your name" 
                class="px-3 py-2 border rounded-md"
                @keyup.enter="joinCanvas"
              />
              <button class="btn btn-primary" @click="joinCanvas">Join</button>
            </div>
            <button v-else class="btn btn-secondary" @click="leaveCanvas">Leave</button>
          </div>
        </div>
      </div>
      <div class="p-4 relative h-[calc(100%-4rem)]">
        <!-- Canvas container -->
        <div 
          ref="canvasContainer"
          class="w-full h-full border border-gray-200 rounded bg-gray-50 relative overflow-hidden"
          @click="handleCanvasClick"
        >
          <!-- Avatars -->
          <Avatar 
            v-for="avatar in avatarList" 
            :key="avatar.id"
            :username="avatar.username"
            :x="avatar.x"
            :y="avatar.y"
            :color="avatar.color"
            :is-moving="isMoving"
          />
          
          <!-- Connection status indicator -->
          <div 
            class="absolute top-2 right-2 px-2 py-1 rounded text-xs"
            :class="isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCanvasStore } from '../stores/canvasStore';
import Avatar from '../components/Avatar.vue';

const canvasStore = useCanvasStore();
const canvasContainer = ref<HTMLElement | null>(null);
const inputUsername = ref('');
const isMoving = ref(false);

// Computed properties from store
const { isConnected, avatarList, connect, disconnect, moveAvatar } = canvasStore;

// Join the canvas
const joinCanvas = () => {
  if (inputUsername.value.trim()) {
    connect(inputUsername.value.trim());
  }
};

// Leave the canvas
const leaveCanvas = () => {
  disconnect();
  inputUsername.value = '';
};

// Handle canvas click
const handleCanvasClick = (event: MouseEvent) => {
  if (!isConnected.value || !canvasContainer.value) return;
  
  const rect = canvasContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Send position update
  moveAvatar(x, y);
};

// Clean up on component unmount
onUnmounted(() => {
  disconnect();
});
</script> 