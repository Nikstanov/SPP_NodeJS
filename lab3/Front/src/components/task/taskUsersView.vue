<script setup lang="ts">
import { Task, type User } from '@/models/task'
import { useTasksStore } from '@/stores/tasks'
import { ref } from 'vue'

const { task } = defineProps<{
  task: Task
}>()

const isLoading = ref(false)
const newUserId = ref('')
const tasksStore = useTasksStore()

function addUser(task: Task) {
  isLoading.value = true
  if (!newUserId.value) {
    return
  }
  tasksStore.addOwner(task._id, newUserId.value).finally(() => {
    isLoading.value = false
  })
  newUserId.value = ''
}

function updateUserRole(event: Event, task: Task, user: User) {
  const el = event.target as HTMLInputElement
  isLoading.value = true
  tasksStore.changeOwnerRole(task._id, user.user._id, el.value as string).finally(() => {
    isLoading.value = false
  })
}

function deleteUser(task: Task, owner: User) {
  isLoading.value = true
  tasksStore.removeOwner(task._id, owner.user._id).finally(() => {
    isLoading.value = false
  })
}
</script>

<template>
  <div class="p-3 flex flex-col">
    <div class="flex flex-row justify-between">
      <div>
        <p class="text-xl mx-3">Participants:</p>
      </div>
      <div>
        <input
          type="text"
          name="user_id"
          minlength="1"
          placeholder="User id"
          class="flex-1 mr-2 p-1 border border-gray-300 rounded-md"
          v-model="newUserId"
        />
        <button
          @click="addUser(task)"
          class="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          Add user
        </button>
      </div>
    </div>
    <div class="m-2 flex flex-row" v-for="owner in task.owners" :key="owner.user">
      <select
        v-if="!isLoading"
        :value="owner.role"
        @change="updateUserRole($event, task, owner)"
        class="border border-gray-300 rounded-md mx-5"
      >
        <option>owner</option>
        <option>editor</option>
        <option>participant</option>
      </select>
      <spin-loader v-else></spin-loader>
      <p class="mx-2">Nickname: {{ owner.user.nickname }}</p>
      <button
        @click="deleteUser(task, owner)"
        class="w-6 mx-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        <p v-if="!isLoading">X</p>
        <spin-loader v-else></spin-loader>
      </button>
    </div>
  </div>
</template>
