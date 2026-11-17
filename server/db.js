import pg from 'pg'
import { readFile } from 'node:fs/promises'

const { Pool } = pg
// PostgreSQL DATE has no time zone. Keep YYYY-MM-DD as text so JSON responses
// cannot shift a document date when the server runs in another time zone.
pg.types.setTypeParser(1082, (value) => value)
export const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {})

export async function migrate() {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  await pool.query(schema)
}

export async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
