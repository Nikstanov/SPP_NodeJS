import { dateFormat } from '@/utills/date'

export type TaskStatus = 'to-do' | 'in process' | 'done' | 'approved'

export class User {
  user: any
  role: string | undefined
}

export class Task {
  _id: string
  title: string
  description: string
  created_at: string
  file: string | null
  status: TaskStatus
  owners: Array<User>
  menuOpened: boolean

  constructor(
    title: string,
    description: string = '',
    time: string = dateFormat(new Date()),
    status: TaskStatus = 'to-do'
  ) {
    this.menuOpened = false
    this._id = ''
    this.status = status
    this.title = title
    this.description = description
    this.created_at = time
    this.file = null
    this.owners = []
  }
}
