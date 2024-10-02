import { defineStore } from 'pinia'
import { Task, type TaskStatus } from '@/models/task'
import {
  getTasks,
  saveTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addTaskOwner,
  changeTaskOwnerRole,
  removeTaskOwner,
  socket
} from '@/api/taskApi'

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
    saveTodos(tasks: Task[]) {
      this.items = new Map(tasks.map((obj) => [obj._id, obj]))
    },
    addTodo(newTask: Task) {
      return saveTask(newTask).then((res) => {
        this.items.set(res._id, res)
      })
    },
    update() {
      return getTasks().then((res) => {
        this.items = new Map(res.map((obj: any) => [obj._id, obj]))
      })
    },
    updateTodo(
      task_id: string,
      newTaskTitle: string,
      newTaskDescription: string,
      newTaskDate: string
    ) {
      return updateTask(task_id, newTaskTitle, newTaskDescription, newTaskDate).then((res) => {
        this.items.set(res._id, res)
      })
    },
    updateStatus(taskId: string, newStatus: TaskStatus) {
      return updateTaskStatus(taskId, newStatus).then((res) => {
        this.items.set(res._id, res)
      })
    },
    addOwner(task_id: string, user_id: string) {
      return addTaskOwner(task_id, user_id).then((res) => {
        this.items.set(res._id, res)
      })
    },
    changeOwnerRole(task_id: string, user_id: string, newRole: string) {
      return changeTaskOwnerRole(task_id, user_id, newRole).then((res) => {
        this.items.set(res._id, res)
      })
    },
    removeOwner(task_id: string, user_id: string) {
      return removeTaskOwner(task_id, user_id).then((res) => {
        this.items.set(res._id, res)
      })
    },
    remove(id: string) {
      return deleteTask(id).then(() => {
        this.items.delete(id)
      })
    },
    clear() {
      this.items.clear()
    }
  }
})

function subscribe() {
  socket.on('connect', () => {
    useTasksStore().update()
  })
  socket.on('update', (newTask) => {
    useTasksStore().items.set(newTask._id, newTask)
  })
  socket.on('delete', (task_id) => {
    useTasksStore().items.delete(task_id)
  })
}
subscribe()
