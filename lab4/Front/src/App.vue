<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
authStore.init()
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
        <RouterLink v-if="!authStore.isAuth" class="mx-3" to="/auth">Sign in</RouterLink>
        <div v-else>
          <h class="mr-5">You are logged as {{ authStore.nickname }}</h>
          <h @click="authStore.signOut" class="cursor-pointer">Sign out</h>
        </div>
      </nav>
    </div>
  </header>
  <RouterView />
</template>

<style scoped></style>
