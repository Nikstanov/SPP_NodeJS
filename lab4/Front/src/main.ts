import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import SpinLoader from './components/spinLoader.vue'
import TaskUsersView from './components/task/taskUsersView.vue'
import TaskUpdateView from './components/task/taskUpdateView.vue'

const app = createApp(App)
app.component('spin-loader', SpinLoader)
app.component('task-users-view', TaskUsersView)
app.component('task-update-view', TaskUpdateView)
app.use(createPinia())
app.use(router)

app.mount('#app')
