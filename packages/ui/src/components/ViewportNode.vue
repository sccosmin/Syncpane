<script setup lang="ts">
import type { Device } from '../data/devices';

defineProps<{
  device: Device;
  url: string;
}>();
</script>

<template>
  <div class="flex-shrink-0 flex flex-col bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs text-gray-300">
      <span class="font-medium text-white">{{ device.name }}</span>
      <span class="text-gray-400 font-mono">{{ device.width }}x{{ device.height }}</span>
    </div>

    <!-- Screen / Iframe Container -->
    <div
      class="bg-white overflow-hidden"
      :style="{ width: `${device.width}px`, height: `${device.height}px` }"
    >
      <iframe
        :src="url"
        class="w-full h-full border-0 block"
        :title="`${device.name} Viewport`"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  </div>
</template>

