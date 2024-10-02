<script setup lang="ts">
import { Task } from '@/models/task'
import { useTasksStore } from '@/stores/tasks'
import { ref } from 'vue'

const newTaskTitle = ref()
const newTaskDate = ref()
const newTaskDescription = ref()

const isLoading = ref(false)

const tasksStore = useTasksStore()

const { task } = defineProps<{
  task: Task
}>()

function updateTodo() {
  isLoading.value = true
  tasksStore
    .updateTodo(task._id, newTaskTitle.value, newTaskDescription.value, newTaskDate.value)
    .finally(() => {
      isLoading.value = false
    })
  newTaskTitle.value = undefined
  newTaskDescription.value = undefined
  newTaskDate.value = undefined
}
</script>

<template>
  <div class="bg-white p-3 border-b">
    <p class="p-2 text-xl">Update task</p>
    <div class="flex flex-col md:flex-row md:items-center">
      <input
        type="text"
        name="title"
        maxlength="20"
        minlength="1"
        placeholder="Task title"
        class="flex-1 mr-2 p-3 border border-gray-300 rounded-md"
        v-model="newTaskTitle"
      />
      <input
        type="text"
        name="description"
        maxlength="1000"
        placeholder="Task description"
        class="flex-1 mr-2 p-3 border border-gray-300 rounded-md"
        v-model="newTaskDescription"
      />
      <input
        type="date"
        v-model="newTaskDate"
        name="time"
        class="flex-1 mr-2 p-3 border border-gray-300 rounded-md"
      />
      <button @click="updateTodo" class="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
        Save Task
      </button>
    </div>
  </div>
</template>
