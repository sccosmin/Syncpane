<script setup lang="ts">
import { defaultDevices } from './data/devices';
import ViewportNode from './components/ViewportNode.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-950 text-white">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shadow-md">
      <div class="flex items-center space-x-3">
        <div class="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
          S
        </div>
        <span class="text-lg font-bold tracking-tight text-white">Syncpane</span>
      </div>

      <div class="text-xs text-gray-400">
        {{ defaultDevices.length }} Viewports
      </div>
    </header>

    <!-- Main Viewports Container -->
    <main class="flex-1 flex overflow-x-auto p-8 gap-8 items-start bg-gray-900 min-h-screen">
      <ViewportNode
        v-for="device in defaultDevices"
        :key="device.id"
        :device="device"
        url="http://localhost:4000"
      />
    </main>
  </div>
</template>
