import { queryAll, execute } from "../client";

export async function initializeSchema(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL
    );`
  );
}

export async function getAll(): Promise<string[]> {
  const migrations = await queryAll<{ filename: string }>(`SELECT filename FROM migrations`);
  if (migrations) {
    return migrations.map(m => m.filename);
  }

  return [];
}

export async function save(migrationFilename: string): Promise<void> {
  await execute(`INSERT INTO migrations (filename) VALUES ($1)`, [ migrationFilename ]);
}