import type { BleService } from './BleService.interface'
import type { HeartbeatConfig } from './types'
import { DEFAULT_HEARTBEAT_CONFIG } from './types'
import { BLE_UUIDS } from '@tremorguard/shared-types'
import { createLogger } from '@tremorguard/utils'

const logger = createLogger('ble-heartbeat')

export class HeartbeatManager {
  private bleService: BleService
  private config: HeartbeatConfig
  private deviceStates = new Map<
    string,
    {
      timerId?: ReturnType<typeof setInterval>
      timeoutId?: ReturnType<typeof setTimeout>
      consecutiveFailures: number
      lastHeartbeat: number
      isRunning: boolean
      reconnectAttempts: number
    }
  >()
  private failureCallbacks = new Set<(deviceId: string) => void>()
  private recoveryCallbacks = new Set<(deviceId: string) => void>()

  constructor(bleService: BleService, config?: Partial<HeartbeatConfig>) {
    this.bleService = bleService
    this.config = { ...DEFAULT_HEARTBEAT_CONFIG, ...config }
  }

  start(deviceId: string): void {
    if (this.deviceStates.get(deviceId)?.isRunning) {
      return
    }

    logger.info(`Starting heartbeat manager for ${deviceId}`)
    this.deviceStates.set(deviceId, {
      consecutiveFailures: 0,
      lastHeartbeat: Date.now(),
      isRunning: true,
      reconnectAttempts: 0,
    })

    this.setupHeartbeatLoop(deviceId)
  }

  stop(deviceId: string): void {
    const state = this.deviceStates.get(deviceId)
    if (!state?.isRunning) return

    logger.info(`Stopping heartbeat manager for ${deviceId}`)
    this.clearTimers(deviceId)
    state.isRunning = false
  }

  stopAll(): void {
    for (const deviceId of this.deviceStates.keys()) {
      this.stop(deviceId)
    }
  }

  isRunning(deviceId: string): boolean {
    return this.deviceStates.get(deviceId)?.isRunning || false
  }

  getLastHeartbeat(deviceId: string): number | undefined {
    return this.deviceStates.get(deviceId)?.lastHeartbeat
  }

  getConsecutiveFailures(deviceId: string): number {
    return this.deviceStates.get(deviceId)?.consecutiveFailures || 0
  }

  onHeartbeatFailure(callback: (deviceId: string) => void): () => void {
    this.failureCallbacks.add(callback)
    return () => this.failureCallbacks.delete(callback)
  }

  onHeartbeatRecovery(callback: (deviceId: string) => void): () => void {
    this.recoveryCallbacks.add(callback)
    return () => this.recoveryCallbacks.delete(callback)
  }

  feed(deviceId: string): void {
    const state = this.deviceStates.get(deviceId)
    if (!state) return

    const wasFailing = state.consecutiveFailures > 0
    state.lastHeartbeat = Date.now()
    state.consecutiveFailures = 0
    state.reconnectAttempts = 0

    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
      state.timeoutId = undefined
    }

    if (wasFailing) {
      logger.info(`Heartbeat recovered for ${deviceId}`)
      this.recoveryCallbacks.forEach((cb) => cb(deviceId))
    }
  }

  private setupHeartbeatLoop(deviceId: string): void {
    const state = this.deviceStates.get(deviceId)
    if (!state) return

    state.timerId = setInterval(() => {
      this.performHeartbeat(deviceId)
    }, this.config.intervalMs)
  }

  private async performHeartbeat(deviceId: string): Promise<void> {
    const state = this.deviceStates.get(deviceId)
    if (!state?.isRunning) return

    if (!this.bleService.isConnected(deviceId)) {
      return
    }

    try {
      await this.bleService.read(
        deviceId,
        BLE_UUIDS.services.tremorService,
        BLE_UUIDS.characteristics.heartbeat,
      )
      this.feed(deviceId)
    } catch (error) {
      this.handleHeartbeatFailure(deviceId, error)
    }
  }

  private handleHeartbeatFailure(deviceId: string, cause: unknown): void {
    const state = this.deviceStates.get(deviceId)
    if (!state?.isRunning) return

    state.consecutiveFailures++
    logger.warn(
      `Heartbeat failure #${state.consecutiveFailures} for ${deviceId}`,
      cause instanceof Error ? cause.message : cause,
    )

    const threshold = 3
    if (state.consecutiveFailures >= threshold) {
      logger.error(`Heartbeat failed after ${threshold} consecutive failures for ${deviceId}`)
      this.failureCallbacks.forEach((cb) => cb(deviceId))
      this.scheduleReconnect(deviceId)
    }
  }

  private scheduleReconnect(deviceId: string): void {
    const state = this.deviceStates.get(deviceId)
    if (!state?.isRunning) return

    if (state.reconnectAttempts >= this.config.maxRetries) {
      logger.error(`Max reconnect attempts (${this.config.maxRetries}) reached for ${deviceId}`)
      this.stop(deviceId)
      return
    }

    state.reconnectAttempts++
    const backoffMs = Math.min(
      1000 * Math.pow(2, state.reconnectAttempts - 1),
      this.config.maxBackoffMs,
    )

    logger.info(
      `Scheduling reconnect attempt #${state.reconnectAttempts} for ${deviceId} in ${backoffMs}ms`,
    )

    state.timeoutId = setTimeout(async () => {
      try {
        await this.bleService.connect(deviceId)
        this.feed(deviceId)
      } catch (error) {
        logger.warn(`Reconnect attempt failed for ${deviceId}`, error)
        this.scheduleReconnect(deviceId)
      }
    }, backoffMs)
  }

  private clearTimers(deviceId: string): void {
    const state = this.deviceStates.get(deviceId)
    if (!state) return

    if (state.timerId) {
      clearInterval(state.timerId)
      state.timerId = undefined
    }
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
      state.timeoutId = undefined
    }
  }

  updateConfig(config: Partial<HeartbeatConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('Heartbeat config updated', this.config)
  }
}
