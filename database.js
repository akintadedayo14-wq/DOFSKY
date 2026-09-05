const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "dofsky.db")
);

db.pragma("foreign_keys = ON");


// ========================================
// Account
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        full_name TEXT,
        email TEXT
    )
`);


// ========================================
// Clients
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);


// ========================================
// Projects
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client_id INTEGER,
        description TEXT,
        start_date TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'planning',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL
    )
`);


// ========================================
// Tasks
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        deadline TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    )
`);


// ========================================
// Account Record
// ========================================

const accountExists = db
    .prepare("SELECT id FROM account WHERE id = 1")
    .get();

if (!accountExists) {

    db.prepare(`
        INSERT INTO account (
            id,
            full_name,
            email
        )
        VALUES (
            1,
            '',
            ''
        )
    `).run();

}


// ========================================
// Database Ready
// ========================================

console.log("DOFSKY database is ready.");

db.close();