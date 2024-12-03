import type { Task } from '@/models/task'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const ref = 'http://localhost:3000/graphql/tasks/'

const instance = axios.create({
  baseURL: 'http://localhost:3000/graphql/tasts/',
  timeout: 1000
})

function getTasks() {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
            query{tasks {
              _id,
              title,
              description,
              status,
              created_at,
              file,
              owners{
                user{
                  _id,
                  nickname
                },
                role
              },
            }}
          `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.tasks
        })
    })
}

function saveTask(task: Task) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
            mutation{
              createTask(
                input: {
                  title: "${task.title}",
                  description: "${task.description}",
                  created_at: "${task.created_at}"
                }
              ){
                _id,
                title,
                description,
                status,
                created_at,
                file,
                owners{
                  user{
                    _id
                  },
                  role
                },
              }
            }
          `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.createTask
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
        .post<any>(
          ref,
          {
            query: `
            mutation{
              updateTask(
                task_id: "${taskId}"
                input: {
                  ${newTaskTitle ? "title: \"" + newTaskTitle + "\"," : ""}
                  ${newTaskDescription ? "description: \"" + newTaskDescription + "\"," : ""}
                  ${newTaskDate ? "created_at: \"" + newTaskDate + "\"," : ""}
                }
              ){
                _id,
                title,
                description,
                status,
                created_at,
                file,
                owners{
                  user{
                    _id
                  },
                  role
                },
              }
            }
          `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.updateTask
        })
    })
}

function updateTaskStatus(id: string, status: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              mutation{
                updateTaskStatus(
                  task_id: "${id}",
                  input: {
                    status: "${status}"
                  }
                ){
                  _id,
                  status
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.updateTaskStatus
        })
    })
}

function addTaskOwner(id: string, ownerId: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              mutation{
                addTaskUser(
                  task_id: "${id}",
                  input: {
                    user_id: "${ownerId}"
                  }
                ){
                  _id,
                  title,
                  description,
                  status,
                  created_at,
                  file,
                  owners{
                    user{
                      _id,
                      nickname
                    },
                    role
                  },
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.addTaskUser
        })
    })
}

function changeTaskOwnerRole(id: string, ownerId: string, role: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              mutation{
                updateTaskUser(
                  task_id: "${id}",
                  input: {
                    user_id: "${ownerId}",
                    role: "${role}"
                  }
                ){
                  _id,
                  title,
                  description,
                  status,
                  created_at,
                  file,
                  owners{
                    user{
                      _id,
                      nickname
                    },
                    role
                  },
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.updateTaskUser
        })
    })
}

function removeTaskOwner(id: string, ownerId: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              mutation{
                updateTaskUser(
                  task_id: "${id}",
                  user_id: "${ownerId}",
                ){
                  _id,
                  title,
                  description,
                  status,
                  created_at,
                  file,
                  owners{
                    user{
                      _id,
                      nickname
                    },
                    role
                  },
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.updateTaskUser
        })
    })
}

function deleteTask(id: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance.post(
        ref,
        {
          query: `mutation{
          deleteTask(
            task_id: "${id}",
          )
        }`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
    })
}

function uploadFile(buffer: string, filename: string, task_id: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              mutation{
                uploadFile(
                  input:{
                    task_id: "${task_id}",
                    filename: "${filename}",
                    buffer: "${buffer}"
                  }
                ){
                  _id,
                  title,
                  description,
                  status,
                  created_at,
                  file,
                  owners{
                    user{
                      _id,
                      nickname
                    },
                    role
                  },
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.uploadFile
        })
    })
}

function downloadFile(task_id: string) {
  return useAuthStore()
    .getAccessToken()
    .then((token) => {
      return instance
        .post<any>(
          ref,
          {
            query: `
              query{
                downloadFile(
                  task_id: "${task_id}"
                ){
                  buffer,
                  filename
                }
              }
            `
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then((res) => {
          return res.data.data.downloadFile
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
  removeTaskOwner,
  uploadFile,
  downloadFile
}
