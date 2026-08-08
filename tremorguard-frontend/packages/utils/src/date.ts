export function formatDate(date: Date | number, format = 'YYYY-MM-DD'): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function startOfDay(date: Date | number): number {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(date: Date | number): number {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function addDays(date: Date | number, days: number): number {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export function durationToMs(duration: Partial<{ hours: number; minutes: number; seconds: number }>): number {
  return (
    (duration.hours || 0) * 3600000 +
    (duration.minutes || 0) * 60000 +
    (duration.seconds || 0) * 1000
  )
}
