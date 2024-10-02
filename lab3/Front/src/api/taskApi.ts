import type { Task } from '@/models/task'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const ref = 'http://localhost:3000/tasks/'

const instance = axios.create({
  baseURL: 'http://localhost:3000/tasts/',
  timeout: 1000
})

function getTasks() {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .get<Task[]>(ref, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => {
          return res.data
        })
    })
}

function saveTask(task: Task) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<Task>(ref, task, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => {
          return res.data
        })
    })
}

function updateTask(
  taskId: string,
  newTaskTitle: string,
  newTaskDescription: string,
  newTaskDate: string
) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .put<Task>(
          ref + taskId,
          { title: newTaskTitle, description: newTaskDescription, created_at: newTaskDate },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data
        })
    })
}

function updateTaskStatus(id: string, status: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .patch<Task>(
          ref + id,
          { status: status },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data
        })
    })
}

function addTaskOwner(id: string, ownerId: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<Task>(
          ref + id + '/users',
          { user_id: ownerId },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data
        })
    })
}

function changeTaskOwnerRole(id: string, ownerId: string, role: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .patch<Task>(
          ref + id + '/users',
          { user_id: ownerId, role: role },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data
        })
    })
}

function removeTaskOwner(id: string, ownerId: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .delete<Task>(ref + id + '/users/' + ownerId, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => {
          return res.data
        })
    })
}

function deleteTask(id: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance.delete(ref + id, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    })
}

export {
  getTasks,
  saveTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
  addTaskOwner,
  changeTaskOwnerRole,
  removeTaskOwner
}
