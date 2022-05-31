import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_POSTGRESDB_HOST,
  port: Number(process.env.DB_POSTGRESDB_PORT),
  database: process.env.DB_POSTGRESDB_DATABASE,
  user: process.env.DB_POSTGRESDB_USER,
  password: process.env.DB_POSTGRESDB_PASSWORD
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);

  process.exit(-1);
});

export async function query<T>(sql: string, params: any[] = []): Promise<T> {
  const client = await pool.connect();

  let result: T = null as unknown as T;

  try {
    const queryResult = await client.query(sql, params);
    if (queryResult.rowCount > 0) {
      result = queryResult.rows[0];
    }
    
  } finally {
    client.release();
  }

  return result;
}

export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();

  let result: T[] = [];

  try {
    const queryResult = await client.query(sql, params);
    if (queryResult.rowCount > 0) {
      result = queryResult.rows;
    }
    
  } finally {
    client.release();
  }

  return result;
}

export async function execute<T>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();

  let result: T[] = [];

  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }

  return result;
}
