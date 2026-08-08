import type { Database } from '../Database.interface'
import type { Patient } from '@tremorguard/shared-types'
import type { Repository } from '../types'
import { generateClientId } from '@tremorguard/utils'

export interface PatientRepository extends Repository<Patient & { clientId: string; syncStatus: 'synced' | 'pending' | 'conflict' }> {
  findByName(name: string): Promise<Patient[]>
  findByDiseaseStage(stage: Patient['diseaseStage']): Promise<Patient[]>
  getCurrentPatient(): Promise<Patient | null>
  setCurrentPatient(id: string): Promise<void>
}

export function createPatientRepository(db: Database): PatientRepository {
  const TABLE = 'patients'

  const rowToEntity = (row: Record<string, unknown>): Patient => ({
    id: String(row.id),
    clientId: String(row.client_id),
    serverId: row.server_id ? String(row.server_id) : undefined,
    name: String(row.name),
    gender: row.gender as Patient['gender'],
    birthDate: String(row.birth_date),
    heightCm: Number(row.height_cm || 0),
    weightKg: Number(row.weight_kg || 0),
    diagnosisDate: row.diagnosis_date ? String(row.diagnosis_date) : '',
    diseaseStage: (row.disease_stage as Patient['diseaseStage']) || 'early',
    primarySymptom: row.primary_symptom ? String(row.primary_symptom) : '',
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
      const clientId = entity.clientId || generateClientId('patient')
      const now = Date.now()
      const id = entity.id || clientId
      const createdAt = entity.createdAt || now
      const updatedAt = entity.updatedAt || now
      const syncStatus = entity.syncStatus || 'pending'

      await db.run(
        `INSERT INTO ${TABLE} (
          id, client_id, server_id, name, gender, birth_date, height_cm, weight_kg,
          diagnosis_date, disease_stage, primary_symptom, created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          clientId,
          entity.serverId || null,
          entity.name,
          entity.gender,
          entity.birthDate,
          entity.heightCm || null,
          entity.weightKg || null,
          entity.diagnosisDate || null,
          entity.diseaseStage || 'early',
          entity.primarySymptom || null,
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
        params.push(value)
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

    async findByName(name) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE name LIKE ? ORDER BY name ASC`,
        [`%${name}%`],
      )
      return rows.map(rowToEntity)
    },

    async findByDiseaseStage(stage) {
      const rows = await db.query(
        `SELECT * FROM ${TABLE} WHERE disease_stage = ? ORDER BY created_at DESC`,
        [stage],
      )
      return rows.map(rowToEntity)
    },

    async getCurrentPatient() {
      const row = await db.queryOne(`SELECT * FROM ${TABLE} ORDER BY created_at DESC LIMIT 1`)
      return row ? rowToEntity(row) : null
    },

    async setCurrentPatient(_id) {
      return
    },
  }
}
