import type { Database } from '../Database.interface'
import type {
  Medication,
  MedicationRecord,
  MedicationAdherenceStatus,
} from '@tremorguard/shared-types'
import type { Repository } from '../types'
import { generateClientId } from '@tremorguard/utils'

export interface MedicationRepository extends Repository<Medication & { clientId: string; syncStatus: 'synced' | 'pending' | 'conflict' }> {
  findByPatientId(patientId: string): Promise<Medication[]>
  findActiveByPatientId(patientId: string): Promise<Medication[]>
  findByIdAndPatientId(id: string, patientId: string): Promise<Medication | null>
}

export interface MedicationRecordRepository
  extends Repository<MedicationRecord & { clientId: string; syncStatus: 'synced' | 'pending' | 'conflict' }> {
  findByPatientId(
    patientId: string,
    options?: { start?: number; end?: number; limit?: number; offset?: number },
  ): Promise<MedicationRecord[]>
  findByMedicationId(medicationId: string, limit?: number): Promise<MedicationRecord[]>
  findByStatus(
    patientId: string,
    status: MedicationAdherenceStatus,
    limit?: number,
  ): Promise<MedicationRecord[]>
  findScheduledForDate(patientId: string, dateStart: number, dateEnd: number): Promise<MedicationRecord[]>
  updateStatus(id: string, status: MedicationAdherenceStatus, takenTime?: number): Promise<MedicationRecord | null>
  getAdherenceSummary(patientId: string, startDate: number, endDate: number): Promise<Array<{
    date: string
    totalDoses: number
    takenDoses: number
    missedDoses: number
    adherenceRate: number
  }>>
}

export function createMedicationRepository(db: Database): MedicationRepository {
  const TABLE = 'medications'

  const rowToEntity = (row: Record<string, unknown>): Medication => ({
    id: String(row.id),
    clientId: String(row.client_id),
    serverId: row.server_id ? String(row.server_id) : undefined,
    patientId: String(row.patient_id),
    name: String(row.name),
    genericName: row.generic_name ? String(row.generic_name) : undefined,
    dosage: String(row.dosage),
    frequency: String(row.frequency) as Medication['frequency'],
    timesPerDay: row.times_per_day ? Number(row.times_per_day) : undefined,
    scheduledTimes: row.scheduled_times ? JSON.parse(String(row.scheduled_times)) : undefined,
    startDate: String(row.start_date),
    endDate: row.end_date ? String(row.end_date) : undefined,
    prescribingDoctor: row.prescribing_doctor ? String(row.prescribing_doctor) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: row.status as 'active' | 'paused' | 'discontinued',
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
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
      const rows = await db.query(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [
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
      const clientId = entity.clientId || generateClientId('med')
      const now = Date.now()
      const id = entity.id || clientId
      const createdAt = entity.createdAt || now
      const updatedAt = entity.updatedAt || now
      const syncStatus = entity.syncStatus || 'pending'

      await db.run(
        `INSERT INTO ${TABLE} (
          id, client_id, server_id, patient_id, name, generic_name, dosage, frequency,
          times_per_day, scheduled_times, start_date, end_date, prescribing_doctor,
          notes, status, created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          clientId,
          entity.serverId || null,
          entity.patientId,
          entity.name,
          entity.genericName || null,
          entity.dosage,
          entity.frequency,
          entity.timesPerDay || null,
          entity.scheduledTimes ? JSON.stringify(entity.scheduledTimes) : null,
          entity.startDate,
          entity.endDate || null,
          entity.prescribingDoctor || null,
          entity.notes || null,
          entity.status || 'active',
          createdAt,
          updatedAt,
          syncStatus,
        ],
      )

      const created = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return rowToEntity(created!)
    },

    async update(id, updates) {
      const fields: string[] = []
      const params: unknown[] = []
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        fields.push(`${col} = ?`)
        params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value)
      }
      if (fields.length === 0) return null

      fields.push('updated_at = ?')
      params.push(Date.now(), id)

      await db.run(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, params)
      const row = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return row ? rowToEntity(row) : null
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

    async findByPatientId(patientId) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE patient_id = ? ORDER BY created_at DESC`,
        [patientId],
      )
      return rows.map(rowToEntity)
    },

    async findActiveByPatientId(patientId) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE patient_id = ? AND status = 'active' ORDER BY created_at DESC`,
        [patientId],
      )
      return rows.map(rowToEntity)
    },

    async findByIdAndPatientId(id, patientId) {
      const row = await db.queryOne(
        `SELECT * FROM ${TABLE} WHERE id = ? AND patient_id = ?`,
        [id, patientId],
      )
      return row ? rowToEntity(row) : null
    },
  }
}

export function createMedicationRecordRepository(db: Database): MedicationRecordRepository {
  const TABLE = 'medication_records'

  const rowToEntity = (row: Record<string, unknown>): MedicationRecord => ({
    id: String(row.id),
    clientId: String(row.client_id),
    serverId: row.server_id ? String(row.server_id) : undefined,
    patientId: String(row.patient_id),
    medicationId: String(row.medication_id),
    scheduledTime: Number(row.scheduled_time),
    takenTime: row.taken_time ? Number(row.taken_time) : undefined,
    status: row.status as MedicationAdherenceStatus,
    dosage: String(row.dosage),
    notes: row.notes ? String(row.notes) : undefined,
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
      const rows = await db.query(
        `SELECT * FROM ${TABLE} ORDER BY scheduled_time DESC LIMIT ? OFFSET ?`,
        [limit, offset],
      )
      return rows.map(rowToEntity)
    },

    async count() {
      const row = await db.queryOne(`SELECT COUNT(*) as cnt FROM ${TABLE}`)
      return row ? Number(row.cnt) : 0
    },

    async insert(entity) {
      const clientId = entity.clientId || generateClientId('medrec')
      const now = Date.now()
      const id = entity.id || clientId
      const createdAt = entity.createdAt || now
      const syncStatus = entity.syncStatus || 'pending'

      await db.run(
        `INSERT INTO ${TABLE} (
          id, client_id, server_id, patient_id, medication_id, scheduled_time,
          taken_time, status, dosage, notes, created_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          clientId,
          entity.serverId || null,
          entity.patientId,
          entity.medicationId,
          entity.scheduledTime,
          entity.takenTime || null,
          entity.status || 'scheduled',
          entity.dosage,
          entity.notes || null,
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
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        fields.push(`${col} = ?`)
        params.push(value)
      }
      if (fields.length === 0) return null

      params.push(Date.now(), id)

      await db.run(
        `UPDATE ${TABLE} SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
        params,
      )
      const row = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return row ? rowToEntity(row) : null
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
        `UPDATE ${TABLE} SET server_id = ?, sync_status = 'synced' WHERE id = ?`,
        [serverId, id],
      )
      return result.changes > 0
    },

    async markConflict(id) {
      const result = await db.run(
        `UPDATE ${TABLE} SET sync_status = 'conflict' WHERE id = ?`,
        [id],
      )
      return result.changes > 0
    },

    async findByPatientId(patientId, options) {
      const { start, end, limit = 100, offset = 0 } = options || {}
      const conditions = ['patient_id = ?']
      const params: unknown[] = [patientId]

      if (start !== undefined) {
        conditions.push('scheduled_time >= ?')
        params.push(start)
      }
      if (end !== undefined) {
        conditions.push('scheduled_time <= ?')
        params.push(end)
      }

      params.push(limit, offset)
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE ${conditions.join(' AND ')} ORDER BY scheduled_time DESC LIMIT ? OFFSET ?`,
        params,
      )
      return rows.map(rowToEntity)
    },

    async findByMedicationId(medicationId, limit = 100) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE medication_id = ? ORDER BY scheduled_time DESC LIMIT ?`,
        [medicationId, limit],
      )
      return rows.map(rowToEntity)
    },

    async findByStatus(patientId, status, limit = 100) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE patient_id = ? AND status = ? ORDER BY scheduled_time DESC LIMIT ?`,
        [patientId, status, limit],
      )
      return rows.map(rowToEntity)
    },

    async findScheduledForDate(patientId, dateStart, dateEnd) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE}
         WHERE patient_id = ? AND scheduled_time >= ? AND scheduled_time <= ?
         ORDER BY scheduled_time ASC`,
        [patientId, dateStart, dateEnd],
      )
      return rows.map(rowToEntity)
    },

    async updateStatus(id, status, takenTime) {
      const result = await db.run(
        `UPDATE ${TABLE} SET status = ?, taken_time = ?, updated_at = ? WHERE id = ?`,
        [status, takenTime || null, Date.now(), id],
      )
      if (result.changes === 0) return null
      const row = await db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id])
      return row ? rowToEntity(row) : null
    },

    async getAdherenceSummary(patientId, startDate, endDate) {
      const rows = await db.query(
        `SELECT
          date(scheduled_time / 1000, 'unixepoch', 'localtime') as date,
          COUNT(*) as total_doses,
          SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken_doses,
          SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_doses
        FROM ${TABLE}
        WHERE patient_id = ? AND scheduled_time >= ? AND scheduled_time <= ?
        GROUP BY date(scheduled_time / 1000, 'unixepoch', 'localtime')
        ORDER BY date ASC`,
        [patientId, startDate, endDate],
      )

      return rows.map((row) => {
        const total = Number(row.total_doses)
        const taken = Number(row.taken_doses)
        return {
          date: String(row.date),
          totalDoses: total,
          takenDoses: taken,
          missedDoses: Number(row.missed_doses),
          adherenceRate: total > 0 ? taken / total : 0,
        }
      })
    },
  }
}
