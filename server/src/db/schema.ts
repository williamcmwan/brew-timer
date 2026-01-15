import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/coffee-timer.db');

export const db: DatabaseType = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guest_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ratio TEXT,
      dose REAL,
      photo TEXT,
      process TEXT,
      process_steps TEXT,
      grind_size REAL,
      water REAL,
      yield REAL,
      temperature REAL,
      brew_time TEXT,
      grinder_model TEXT,
      brewer_model TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id TEXT NOT NULL,
      name TEXT NOT NULL,
      ratio TEXT,
      dose REAL,
      photo TEXT,
      process TEXT,
      process_steps TEXT,
      grind_size REAL,
      water REAL,
      yield REAL,
      temperature REAL,
      brew_time TEXT,
      favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guest_id) REFERENCES guest_users(guest_id)
    );
  `);

  console.log('Database initialized for Coffee Timer');
}