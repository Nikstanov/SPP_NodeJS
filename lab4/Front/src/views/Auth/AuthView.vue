<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import FileUpload from 'primevue/fileupload'
import Loader from '@/components/spinLoader.vue'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const authStore = useAuthStore()
const isLoading = ref(false)

function submit() {
  isLoading.value = true
  authStore
    .auth()
    .then(() => {
      router.replace('/')
    })
    .finally(() => {
      isLoading.value = false
    })
}
</script>

<template>
  <main class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-3xl font-bold text-center mb-6">
        {{ authStore.mode === 'sign_up' ? 'Sign Up' : 'Sign In' }}
      </h1>
      <form @submit.prevent="submit">
        <div class="mb-4">
          <label for="email" class="block text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            v-model="authStore.email"
            class="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter your email"
          />
        </div>
        <div v-show="authStore.mode === 'sign_up'" class="mb-4">
          <label for="nickname" class="block text-gray-700">Nickname</label>
          <input
            type="text"
            id="nickname"
            v-model="authStore.nickname"
            class="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter your password"
          />
        </div>
        <div class="mb-4">
          <label for="password" class="block text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            v-model="authStore.password"
            class="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter your password"
          />
        </div>
        <div class="mb-6" v-show="authStore.mode === 'sign_up'">
          <label for="confirm-password" class="block text-gray-700">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            v-model="authStore.confirmPassword"
            class="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Confirm your password"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700"
        >
          <h v-if="!isLoading">
            {{ authStore.mode === 'sign_up' ? 'Sign Up' : 'Sign In' }}
          </h>
          <loader v-else></loader>
        </button>
        <div class="flex justify-center">
          <h @click="authStore.changeMode" class="cursor-pointer">
            {{ authStore.mode === 'sign_up' ? 'Already have an account?' : 'Create account' }}
          </h>
        </div>
      </form>
    </div>
  </main>
</template>
