import type { Task } from '@/models/task'
import axios from 'axios'

const ref = 'http://localhost:3000/tasks/'

const instance = axios.create({
  baseURL: ref,
  timeout: 1000
})

async function getTasks(): Promise<Task[]> {
  return instance
    .get<Task[]>(ref)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      throw Error(err.response.data.error)
    })
}

async function saveTask(task: Task) {
  return instance
    .post(ref, task)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      if (err.status === 500) {
        throw Error(err.response.data.error)
      }
      let errMessage = ''
      err.response.data.errors.forEach((element: any) => {
        errMessage += element.msg + ','
      })
      throw Error(errMessage.substring(0, errMessage.length - 2))
    })
}

async function updateTask(task: Task) {
  return instance
    .put(ref + task.title, task)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      if (err.status === 500) {
        throw Error(err.response.data.error)
      }
      let errMessage = ''
      err.response.data.errors.forEach((element: any) => {
        errMessage += element.msg + ','
      })
      throw Error(errMessage.substring(0, errMessage.length - 2))
    })
}

async function deleteTask(title: string) {
  return instance
    .delete(ref + title)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      if (err.status === 500) {
        throw Error(err.response.data.error)
      }
      let errMessage = ''
      err.response.data.errors.forEach((element: any) => {
        errMessage += element.msg + ','
      })
      throw Error(errMessage.substring(0, errMessage.length - 2))
    })
}

export { getTasks, saveTask, deleteTask, updateTask }
