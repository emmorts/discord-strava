import { Logger } from 'winston';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execute } from './client';
import { formatNs, timeAsync } from '../util/timer-utils';
import { initializeSchema, getAll, save } from './repositories/migration.repository';

const MIGRATION_PATH = join(__dirname, 'migrations');

export async function initializeDatabase(logger: Logger) {
  await initializeSchema();

  const migrations = await getMigrations();
  
  for (let i = 0; i < migrations.length; i++) {
    await executeMigration(migrations[i], logger);
  }
}

async function getMigrationsInDirectory(): Promise<string[]> {
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  const files = await readdir(MIGRATION_PATH);

  files.sort((a, b) => collator.compare(a, b));

  return files;
}

async function getMigrations() {
  const allMigrations = await getMigrationsInDirectory() || [];
  const existingMigrations = await getAll() || [];

  return allMigrations.filter(migration => !existingMigrations.includes(migration));
}

async function executeMigration(migrationFilename: string, logger: Logger): Promise<void> {
  const migrationPath = join(MIGRATION_PATH, migrationFilename);
  const migration = await readFile(migrationPath, 'utf-8');

  logger.info(`Executing migration '${migrationFilename}'...`);

  try {
    await timeAsync(() => execute(migration), (elapsed) => logger.info(`Executed migration '${migrationFilename}' in ${formatNs(elapsed)}`));
    
    await save(migrationFilename);
  } catch (error) {
    logger.error(`Error executing migration '${migrationFilename}': ${error}`, { error });
  }
}