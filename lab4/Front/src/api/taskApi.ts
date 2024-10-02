import type { Task } from '@/models/task'
import { useAuthStore } from '@/stores/auth'
import { io } from 'socket.io-client'

const ref = 'http://localhost:3000'

const socket = io(ref, {
  auth(cb) {
    useAuthStore()
      .getAccessToken()
      .then((token) => {
        cb({
          token: token
        })
      })
  }
}).connect()

function reconnect() {
  socket.disconnect()
  socket.connect()
}

socket.on('connect', () => {
  console.log(socket.connected) // true
})

function getTasks() {
  return socket
    .timeout(5000)
    .emitWithAck('/')
    .then((response: any) => {
      return response.data
    })
}

function saveTask(task: Task) {
  return socket.emitWithAck('/create', task).then((response: any) => {
    return response.data
  })
}

function updateTask(
  taskId: string,
  newTaskTitle: string,
  newTaskDescription: string,
  newTaskDate: string
) {
  return socket
    .emitWithAck('/put', {
      task_id: taskId,
      title: newTaskTitle,
      description: newTaskDescription,
      created_at: newTaskDate
    })
    .then((response: any) => {
      return response.data
    })
}

function updateTaskStatus(id: string, status: string) {
  return socket
    .emitWithAck('/update_status', { task_id: id, status: status })
    .then((response: any) => {
      return response.data
    })
}

function addTaskOwner(id: string, ownerId: string) {
  return socket
    .emitWithAck('/add_user', { task_id: id, user_id: ownerId })
    .then((response: any) => {
      return response.data
    })
}

function changeTaskOwnerRole(id: string, ownerId: string, role: string) {
  return socket
    .emitWithAck('/update_user', { task_id: id, user_id: ownerId, role: role })
    .then((response: any) => {
      return response.data
    })
}

function removeTaskOwner(id: string, ownerId: string) {
  return socket.emitWithAck('/delete', { task_id: id, user_id: ownerId }).then((response: any) => {
    return response.data
  })
}

function deleteTask(id: string) {
  return socket.emitWithAck('/delete', { task_id: id }).then((response: any) => {
    return response.data
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
  removeTaskOwner,
  reconnect,
  socket
}
