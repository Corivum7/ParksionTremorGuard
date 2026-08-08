export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: number
  level: LogLevel
  tag: string
  message: string
  data?: unknown
}

export interface LoggerOptions {
  tag: string
  minLevel?: LogLevel
  enableConsole?: boolean
  onLog?: (entry: LogEntry) => void
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

export class Logger {
  private tag: string
  private minLevel: LogLevel
  private enableConsole: boolean
  private onLog?: (entry: LogEntry) => void

  constructor(options: LoggerOptions) {
    this.tag = options.tag
    this.minLevel = options.minLevel || 'info'
    this.enableConsole = options.enableConsole ?? true
    this.onLog = options.onLog
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      tag: this.tag,
      message,
      data,
    }

    if (this.enableConsole) {
      const prefix = `[${this.tag}] ${level.toUpperCase()}`
      const consoleMethod = level === 'debug' ? 'log' : level
      if (data !== undefined) {
        console[consoleMethod as 'log' | 'warn' | 'error'](prefix, message, data)
      } else {
        console[consoleMethod as 'log' | 'warn' | 'error'](prefix, message)
      }
    }

    this.onLog?.(entry)
  }

  child(subTag: string): Logger {
    return new Logger({
      tag: `${this.tag}:${subTag}`,
      minLevel: this.minLevel,
      enableConsole: this.enableConsole,
      onLog: this.onLog,
    })
  }
}

export function createLogger(tag: string, options?: Partial<LoggerOptions>): Logger {
  return new Logger({ tag, ...options })
}
