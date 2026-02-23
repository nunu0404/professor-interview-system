import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'interview.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      professor_name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 5,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      affiliation TEXT,
      choice1_lab_id INTEGER REFERENCES labs(id),
      choice2_lab_id INTEGER REFERENCES labs(id),
      choice3_lab_id INTEGER REFERENCES labs(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      session_number INTEGER NOT NULL CHECK(session_number IN (1, 2, 3)),
      lab_id INTEGER NOT NULL REFERENCES labs(id),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, session_number)
    );
  `);

  // Seed sample labs if empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM labs').get() as { c: number }).c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO labs (name, professor_name, capacity, description, location)
      VALUES (?, ?, ?, ?, ?)
    `);
    const labs = [
      ['인공지능 연구실', '김철수 교수', 6, '머신러닝, 딥러닝, 자연어처리 분야 연구', 'E3-401'],
      ['컴퓨터비전 연구실', '이영희 교수', 5, '이미지 인식, 객체 탐지, 의료 영상 분석', 'E3-402'],
      ['분산시스템 연구실', '박민준 교수', 5, '클라우드 컴퓨팅, 엣지 컴퓨팅, 블록체인', 'E3-403'],
      ['사이버보안 연구실', '최수진 교수', 4, '네트워크 보안, 암호화, 취약점 분석', 'E3-404'],
      ['HCI 연구실', '정태양 교수', 6, '사용자 인터페이스, 증강현실, UX 연구', 'E3-405'],
      ['데이터베이스 연구실', '강나라 교수', 5, '빅데이터, 분산 DB, 쿼리 최적화', 'E3-406'],
    ];
    for (const lab of labs) {
      insert.run(...lab);
    }
  }
}
