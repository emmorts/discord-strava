import sqlite3 from 'sqlite3';
import path from 'path';

export async function openDatabase(): Promise<sqlite3.Database> {
  const databasePath = path.join(__dirname, '../../db/strava.db');

  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(databasePath, err => {
      if (err) {
        reject(`Failed to open databse in ${databasePath}: ${err}`);
      } else {
        resolve(database);
      }
    });
  });
}

export async function closeDatabase(connection: sqlite3.Database) {
  return new Promise((resolve, reject) => {
    connection.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
}

export async function serialize(connection: sqlite3.Database, callback: () => Promise<void>) {
  return new Promise((resolve, reject) => {
    connection.serialize(() => {
      callback()
        .then(resolve)
        .catch(reject);
    });
  });
}

export async function query<T>(sql: string, params: any = undefined): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const connection = await openDatabase();

    connection.serialize(() => {
      connection.get(sql, params, (err, row) => {
        if (err) {
          reject(`error executing query: ${err}`);
        } else {
          resolve(row);
        }
      });
    });

    await closeDatabase(connection);
  });
}

export async function queryAll<T>(sql: string, params: any = undefined): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const connection = await openDatabase();

    connection.serialize(() => {
      connection.all(sql, params, (err, rows) => {
        if (err) {
          reject(`error executing queryAll: ${err}`);
        } else {
          resolve(rows);
        }
      });
    });

    await closeDatabase(connection);
  });
}

export async function execute(sql: string, params: any = undefined): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const connection = await openDatabase();

    connection.serialize(() => {
      connection.run(sql, params, err => {
        if (err) {
          reject(`error executing execute: ${err}`);
        } else {
          resolve();
        }
      });
    });

    await closeDatabase(connection);
  });
}