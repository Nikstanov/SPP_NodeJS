<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div
      class="bg-blue-600 text-white p-6 shadow-md flex font-semibold text-xl px-5 py-2 justify-between"
    >
      <nav class="flex-2">
        <RouterLink class="text-2xl mx-3" to="/">TO-DO list</RouterLink>
      </nav>
      <nav>
        <RouterLink class="mx-3" to="/">Sign in</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped></style>
