import { dateFormat } from '@/utills/date'

export type TaskStatus = 'to-do' | 'in process' | 'done' | 'approved'

export class Task {
  _id: string
  title: string
  description: string
  created_at: string
  file: string | null
  status: TaskStatus

  constructor(
    title: string,
    description: string = '',
    created_at: string = dateFormat(new Date()),
    status: TaskStatus = 'to-do'
  ) {
    this._id = ''
    this.status = status
    this.title = title
    this.description = description
    this.created_at = created_at
    this.file = null
  }
}
