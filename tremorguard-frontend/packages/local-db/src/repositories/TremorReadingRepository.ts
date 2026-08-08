import type { Database } from '../Database.interface'
import type { TremorReading, TremorSeverity, TremorType } from '@tremorguard/shared-types'
import type { Repository } from '../types'
import { generateClientId } from '@tremorguard/utils'

export interface TremorReadingRepository extends Repository<TremorReading & { clientId: string; syncStatus: 'synced' | 'pending' | 'conflict' }> {
  findByPatientId(
    patientId: string,
    options?: { start?: number; end?: number; limit?: number; offset?: number },
  ): Promise<TremorReading[]>
  findByPatientIdAndSeverity(
    patientId: string,
    severity: TremorSeverity,
    limit?: number,
  ): Promise<TremorReading[]>
  findByPatientIdAndType(
    patientId: string,
    type: TremorType,
    limit?: number,
  ): Promise<TremorReading[]>
  countByPatientId(patientId: string, start?: number, end?: number): Promise<number>
  getDailySummary(patientId: string, startDate: number, endDate: number): Promise<Array<{
    date: string
    totalEpisodes: number
    avgSeverity: number
    maxSeverity: TremorSeverity
    totalDurationMs: number
  }>>
}

export function createTremorReadingRepository(db: Database): TremorReadingRepository {
  const TABLE = 'tremor_readings'

  const rowToEntity = (row: Record<string, unknown>): TremorReading => ({
    id: String(row.id),
    clientId: String(row.client_id),
    serverId: row.server_id ? String(row.server_id) : undefined,
    patientId: String(row.patient_id),
    deviceId: String(row.device_id),
    timestamp: Number(row.timestamp),
    durationMs: Number(row.duration_ms),
    amplitude: {
      x: Number(row.amplitude_x || 0),
      y: Number(row.amplitude_y || 0),
      z: Number(row.amplitude_z || 0),
      magnitude: Number(row.amplitude_magnitude || 0),
    },
    frequencyHz: Number(row.frequency_hz || 0),
    severity: row.severity as TremorSeverity,
    type: row.type as TremorType,
    accelerometerData: row.accelerometer_data ? JSON.parse(String(row.accelerometer_data)) : undefined,
    gyroscopeData: row.gyroscope_data ? JSON.parse(String(row.gyroscope_data)) : undefined,
    batteryLevel: Number(row.battery_level || 0),
    createdAt: Number(row.created_at),
    syncStatus: row.sync_status as 'synced' | 'pending' | 'conflict',
  })

  return {
    async findById(id) {
      const row = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return row ? rowToEntity(row) : null
    },

    async findByClientId(clientId) {
      const row = await db.queryOne(`SELECT * FROM ${TABLE} WHERE client_id = ?`, [clientId])
      return row ? rowToEntity(row) : null
    },

    async findAll(limit = 100, offset = 0) {
      const rows = await db.query(`SELECT * FROM ${TABLE} ORDER BY timestamp DESC LIMIT ? OFFSET ?`, [
        limit,
        offset,
      ])
      return rows.map(rowToEntity)
    },

    async count() {
      const row = await db.queryOne(`SELECT COUNT(*) as cnt FROM ${TABLE}`)
      return row ? Number(row.cnt) : 0
    },

    async insert(entity) {
      const clientId = entity.clientId || generateClientId('reading')
      const now = Date.now()
      const id = entity.id || clientId
      const createdAt = entity.createdAt || now
      const updatedAt = entity.updatedAt || now
      const syncStatus = entity.syncStatus || 'pending'

      await db.run(
        `INSERT INTO ${TABLE} (
          id, client_id, server_id, patient_id, device_id, timestamp, duration_ms,
          amplitude_x, amplitude_y, amplitude_z, amplitude_magnitude,
          frequency_hz, severity, type, accelerometer_data, gyroscope_data,
          battery_level, created_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          clientId,
          entity.serverId || null,
          entity.patientId,
          entity.deviceId,
          entity.timestamp,
          entity.durationMs,
          entity.amplitude?.x || 0,
          entity.amplitude?.y || 0,
          entity.amplitude?.z || 0,
          entity.amplitude?.magnitude || 0,
          entity.frequencyHz || 0,
          entity.severity,
          entity.type,
          entity.accelerometerData ? JSON.stringify(entity.accelerometerData) : null,
          entity.gyroscopeData ? JSON.stringify(entity.gyroscopeData) : null,
          entity.batteryLevel || 0,
          createdAt,
          syncStatus,
        ],
      )

      const created = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return rowToEntity(created!)
    },

    async update(id, updates) {
      const fields: string[] = []
      const params: unknown[] = []

      if (updates.serverId !== undefined) {
        fields.push('server_id = ?')
        params.push(updates.serverId)
      }
      if (updates.syncStatus !== undefined) {
        fields.push('sync_status = ?')
        params.push(updates.syncStatus)
      }
      if (updates.severity !== undefined) {
        fields.push('severity = ?')
        params.push(updates.severity)
      }
      if (updates.durationMs !== undefined) {
        fields.push('duration_ms = ?')
        params.push(updates.durationMs)
      }

      if (fields.length === 0) return null

      fields.push('updated_at = ?')
      params.push(Date.now(), id)

      await db.run(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, params)
      return (await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]))
        ? rowToEntity((await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]))!)
        : null
    },

    async delete(id) {
      const result = await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id])
      return result.changes > 0
    },

    async findPendingSync() {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE sync_status = 'pending' ORDER BY created_at ASC`,
      )
      return rows.map(rowToEntity)
    },

    async markSynced(id, serverId) {
      const result = await db.run(
        `UPDATE ${TABLE} SET server_id = ?, sync_status = 'synced', updated_at = ? WHERE id = ?`,
        [serverId, Date.now(), id],
      )
      return result.changes > 0
    },

    async markConflict(id) {
      const result = await db.run(
        `UPDATE ${TABLE} SET sync_status = 'conflict', updated_at = ? WHERE id = ?`,
        [Date.now(), id],
      )
      return result.changes > 0
    },

    async findByPatientId(patientId, options) {
      const { start, end, limit = 100, offset = 0 } = options || {}
      const conditions = ['patient_id = ?']
      const params: unknown[] = [patientId]

      if (start !== undefined) {
        conditions.push('timestamp >= ?')
        params.push(start)
      }
      if (end !== undefined) {
        conditions.push('timestamp <= ?')
        params.push(end)
      }

      params.push(limit, offset)
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
        params,
      )
      return rows.map(rowToEntity)
    },

    async findByPatientIdAndSeverity(patientId, severity, limit = 100) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE patient_id = ? AND severity = ? ORDER BY timestamp DESC LIMIT ?`,
        [patientId, severity, limit],
      )
      return rows.map(rowToEntity)
    },

    async findByPatientIdAndType(patientId, type, limit = 100) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE patient_id = ? AND type = ? ORDER BY timestamp DESC LIMIT ?`,
        [patientId, type, limit],
      )
      return rows.map(rowToEntity)
    },

    async countByPatientId(patientId, start, end) {
      const conditions = ['patient_id = ?']
      const params: unknown[] = [patientId]

      if (start !== undefined) {
        conditions.push('timestamp >= ?')
        params.push(start)
      }
      if (end !== undefined) {
        conditions.push('timestamp <= ?')
        params.push(end)
      }

      const row = await db.queryOne(
        `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE ${conditions.join(' AND ')}`,
        params,
      )
      return row ? Number(row.cnt) : 0
    },

    async getDailySummary(patientId, startDate, endDate) {
      const rows = await db.query(
        `SELECT
          date(timestamp / 1000, 'unixepoch', 'localtime') as date,
          COUNT(*) as total_episodes,
          AVG(CASE severity
            WHEN 'none' THEN 0
            WHEN 'mild' THEN 1
            WHEN 'moderate' THEN 2
            WHEN 'severe' THEN 3
            ELSE 0
          END) as avg_severity,
          MAX(CASE severity
            WHEN 'none' THEN 0
            WHEN 'mild' THEN 1
            WHEN 'moderate' THEN 2
            WHEN 'severe' THEN 3
            ELSE 0
          END) as max_severity,
          SUM(duration_ms) as total_duration_ms
        FROM ${TABLE}
        WHERE patient_id = ? AND timestamp >= ? AND timestamp <= ?
        GROUP BY date(timestamp / 1000, 'unixepoch', 'localtime')
        ORDER BY date ASC`,
        [patientId, startDate, endDate],
      )

      const severityFromNum = (n: number): TremorSeverity => {
        if (n >= 3) return 'severe'
        if (n >= 2) return 'moderate'
        if (n >= 1) return 'mild'
        return 'none'
      }

      return rows.map((row) => ({
        date: String(row.date),
        totalEpisodes: Number(row.total_episodes),
        avgSeverity: Number(row.avg_severity || 0),
        maxSeverity: severityFromNum(Number(row.max_severity || 0)),
        totalDurationMs: Number(row.total_duration_ms || 0),
      }))
    },
  }
}
