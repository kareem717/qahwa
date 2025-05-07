import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const getDb = (databaseUrl: string) => {
  // Disable prefetch as it is not supported for "Transaction" pool mode 
  const client = postgres(databaseUrl, { prepare: false })
  return drizzle({ client, schema })
}