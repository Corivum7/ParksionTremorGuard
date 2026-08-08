export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

export function generateClientId(entity: string): string {
  return `cli_${entity}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
}

export function isClientId(id: string): boolean {
  return id.startsWith('cli_')
}

export function isServerId(id: string): boolean {
  return id.startsWith('srv_') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}
