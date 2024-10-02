const yearFormatter = new Intl.DateTimeFormat('en', { year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('en', { month: '2-digit' })
const dayFormatter = new Intl.DateTimeFormat('en', { day: '2-digit' })

export function dateFormat(date: Date): string {
  return `${yearFormatter.format(date)}-${monthFormatter.format(date)}-${dayFormatter.format(date)}`
}
