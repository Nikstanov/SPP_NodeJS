<script setup lang="ts">
import { Task, type TaskStatus } from '@/models/task'
import { useTasksStore } from '@/stores/tasks'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import FileUpload from 'primevue/fileupload'
import ClipLoader from 'vue-spinner/src/ClipLoader.vue'

const tasksStore = useTasksStore()
tasksStore.update()
const { filter, filterDate, filteredTodos } = storeToRefs(tasksStore)

const newTaskTitle = ref('')
const newTaskDate = ref()
const newTaskDescription = ref('')
const isLoading = ref(false)
const errMessage = ref('')

function addTodo() {
  errMessage.value = ''
  isLoading.value = true
  if (!newTaskTitle.value) {
    return
  }
  tasksStore
    .addTodo(new Task(newTaskTitle.value, newTaskDescription.value, newTaskDate.value))
    .catch((err) => {
      errMessage.value = err.message
    })
    .finally(() => {
      isLoading.value = false
    })
  newTaskTitle.value = ''
  newTaskDescription.value = ''
  newTaskDate.value = undefined
}

function updateStatus(event: Event, task: Task) {
  const el = event.target as HTMLInputElement
  isLoading.value = true
  tasksStore
    .addTodo(new Task(task.title, task.description, task.created_at, el.value as TaskStatus))
    .finally(() => {
      isLoading.value = false
    })
}

function deleteTodo(title: string) {
  isLoading.value = true
  tasksStore.remove(title).finally(() => {
    isLoading.value = false
  })
}
</script>

<template>
  <main class="p-6 flex flex-col h-screen bg-slate-200">
    <div class="mb-6 bg-white p-6 rounded-lg shadow-sm border-2">
      <h v-show="errMessage !== ''">{{ errMessage }}</h>
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
        <button @click="addTodo" class="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
          Save Task
        </button>
      </div>
    </div>
    <div class="bg-white p-6 rounded-lg shadow-sm border-2">
      <div>
        <select name="status" class="p-2 border border-gray-300 rounded-md mx-5" v-model="filter">
          <option>all</option>
          <option>to-do</option>
          <option>in process</option>
          <option>done</option>
          <option>approved</option>
        </select>
        <input
          type="date"
          v-model="filterDate"
          name="date"
          class="flex-1 mr-2 p-3 border border-gray-300 rounded-md"
        />
      </div>
      <ul v-if="filteredTodos.length > 0">
        <li
          class="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-300"
          v-for="task in filteredTodos"
          :key="task._id"
        >
          <div class="flex items-center w-3/4">
            <select
              v-if="!isLoading"
              v-model="task.status"
              @change="updateStatus($event, task)"
              class="p-2 border border-gray-300 rounded-md mx-5"
            >
              <option>to-do</option>
              <option>in process</option>
              <option>done</option>
              <option>approved</option>
            </select>
            <ClipLoader v-else></ClipLoader>
            <span class="text-2xl mr-3">{{ task.title }}</span>
            <span class="text-2xl mr-3 w-40">{{ task.created_at }}</span>
            <span class="w-3/4 text-lg text-pretty">{{ task.description }}</span>
          </div>
          <div class="flex items-center mt-2 md:mt-0">
            <a
              v-show="task.file !== null"
              :href="'http://localhost:3000/uploads/' + task.file"
              download
            >
              <div class="mr-3">download</div>
            </a>
            <FileUpload
              mode="basic"
              name="file"
              :url="'http://localhost:3000/tasks/' + task.title + '/upload_file'"
              :maxFileSize="1000000"
              :auto="true"
              chooseLabel="upload"
            />
          </div>
          <button
            @click="deleteTodo(task.title)"
            class="w-24 bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
          >
            <h v-if="!isLoading">Delete</h>
            <ClipLoader v-else></ClipLoader>
          </button>
        </li>
      </ul>
      <h1 v-else class="text-2xl text-center">Empty</h1>
    </div>
  </main>
</template>
