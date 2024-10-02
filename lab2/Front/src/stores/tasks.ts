import { defineStore } from 'pinia'
import { Task, type TaskStatus } from '@/models/task'
import { getTasks, saveTask, updateTask, deleteTask } from '@/api/taskApi'

export type TasksState = {
  items: Map<string, Task>
  filter: TaskStatus | 'all'
  filterDate: string
}

export const useTasksStore = defineStore({
  id: 'tasksStore',
  state: () =>
    ({
      items: new Map(),
      filter: 'all',
      filterDate: ''
    }) as TasksState,

  getters: {
    filteredTodos(state): Task[] {
      if (this.filter === 'all' && this.filterDate === '') {
        return [...this.items.values()]
      } else {
        const values = [...this.items.values()]
        if (this.filter !== 'all' && this.filterDate !== '') {
          return values.filter(
            (item) => item.status === this.filter && item.created_at === this.filterDate
          )
        } else {
          if (this.filter === 'all') {
            return values.filter((item) => item.created_at === this.filterDate)
          } else {
            return values.filter((item) => item.status === this.filter)
          }
        }
      }
    }
  },
  actions: {
    addTodo(newTask: Task) {
      if (this.items.has(newTask.title)) {
        return updateTask(newTask).then((res) => {
          this.items.set(newTask.title, res)
        })
      } else {
        return saveTask(newTask).then((res) => {
          this.items.set(newTask.title, res)
        })
      }
    },
    saveTodos(tasks: Task[]) {
      this.items = new Map(tasks.map((obj) => [obj.title, obj]))
    },
    update() {
      getTasks().then((res) => {
        this.items = new Map(res.map((obj) => [obj.title, obj]))
      })
    },
    remove(title: string) {
      return deleteTask(title).then(() => {
        this.items.delete(title)
      })
    }
  }
})

setInterval(async () => {
  const response = await getTasks()
  useTasksStore().saveTodos(response)
}, 5000)
