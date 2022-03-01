import sqlite3 from 'sqlite3';
import path from 'path';
import { AthleteAccess } from '../models/athlete-access';
import { AthleteActivity } from '../models/athlete-activity';

function openDatabase() {
  const databasePath = path.join(__dirname, '../../db/strava.db');

  return new sqlite3.Database(databasePath, err => {
    if (err) {
      console.log(`Failed to open databse in ${databasePath}: ${err}`);
    } else {
      console.log(`Successfully opened database in ${databasePath}`);
    }
  });
}

export function initializeDatabase() {
  const db = openDatabase();
  
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS athlete_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        athlete_id INTEGER NOT NULL,
        athlete_firstname TEXT NOT NULL,
        athlete_lastname TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS athlete_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        athlete_id INTEGER NOT NULL,
        activity_id INTEGER NOT NULL
      );
    `);
  });

  db.close();
}

export function getAthleteActivity(activityId: number): Promise<AthleteActivity> {

  return new Promise((resolve, reject) => {
    const db = openDatabase();

    db.get(`
      SELECT * FROM athlete_activity
      WHERE activity_id = ?
    `, [ activityId ], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });

    db.close();
  });
}

export function saveAthleteActivity(athleteActivity: AthleteActivity) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    db.serialize(() => {
      db.run(`
        INSERT INTO athlete_activity (athlete_id, activity_id)
        VALUES ($athleteId, $activityId)
      `, {
        $athleteId: athleteActivity.athlete_id,
        $accessactivityIdToken: athleteActivity.activity_id
      }, err => {
        if (err) {
          reject(err);
        } else {
          console.log(`Saved athlete activity ${athleteActivity.activity_id}`);

          resolve(null);
        }
      });
    });

    db.close();
  });
}

export function getAthleteAccess(atheleId: number): Promise<AthleteAccess> {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    db.get(`
      SELECT * FROM athlete_access
      WHERE athlete_id = ?
    `, [ atheleId ], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });

    db.close();
  });
}

export function getAllAthleteAccesses(): Promise<AthleteAccess[]> {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    db.all(`SELECT * FROM athlete_access`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });

    db.close();
  });
}

export function saveAthleteAccess(athleteAccess: AthleteAccess) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();

    db.serialize(() => {
      if (athleteAccess.id) {
        db.run(`
          UPDATE athlete_access
          SET
            access_token = $accessToken,
            athlete_firstname = $athleteFirstname,
            athlete_lastname = $athleteLastname,
            refresh_token = $refreshToken,
            expires_at = $expiresAt
          WHERE athlete_id = $athleteId
        `, {
          $athleteId: athleteAccess.athlete_id,
          $accessToken: athleteAccess.access_token,
          $athleteFirstname: athleteAccess.athlete_firstname,
          $athleteLastname: athleteAccess.athlete_lastname,
          $refreshToken: athleteAccess.refresh_token,
          $expiresAt: athleteAccess.expires_at
        }, err => {
          if (err) {
            reject(err);
          } else {
            console.log(`Updated athlete access for athlete ${athleteAccess.athlete_id}`);

            resolve(null);
          }
        });
      } else {
        db.run(`
          INSERT INTO athlete_access (athlete_id, access_token, athlete_firstname, athlete_lastname, refresh_token, expires_at)
          VALUES ($athleteId, $accessToken, $athleteFirstname, $athleteLastname, $refreshToken, $expiresAt)
        `, {
          $athleteId: athleteAccess.athlete_id,
          $accessToken: athleteAccess.access_token,
          $athleteFirstname: athleteAccess.athlete_firstname,
          $athleteLastname: athleteAccess.athlete_lastname,
          $refreshToken: athleteAccess.refresh_token,
          $expiresAt: athleteAccess.expires_at
        }, err => {
          if (err) {
            reject(err);
          } else {
            console.log(`Saved athlete access for athlete ${athleteAccess.athlete_id}`);

            resolve(null);
          }
        });
      }
    });
    
    db.close();
  });
}