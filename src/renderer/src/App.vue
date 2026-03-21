<script setup lang="ts">
import { onMounted, ref } from 'vue'

const connections = ref([])

onMounted(() => {
  window.network.onTrafficUpdate((data) => {
    connections.value = data
    console.log(data)
  })
})
</script>

<template>
  <div>
    <textarea name="hello">hello</textarea>
  </div>
</template>
