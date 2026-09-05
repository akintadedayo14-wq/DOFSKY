const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;


/* ========================================
   Database
======================================== */

const dbPath = path.join(__dirname, "dofsky.db");

// Create/connect to the SQLite database
const db = new Database(dbPath);

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


/* ========================================
   Middleware
======================================== */

app.use(express.json());
app.use(express.static(__dirname));


/* ========================================
   Health
======================================== */

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: "connected"
    });
});


/* ========================================
   Account
======================================== */

app.get("/api/account", (req, res) => {

    const account = db
        .prepare(`
            SELECT
                id,
                full_name,
                email
            FROM account
            WHERE id = 1
        `)
        .get();

    res.json(account);
});


app.post("/api/account", (req, res) => {

    const {
        full_name,
        email
    } = req.body;

    db.prepare(`
        UPDATE account
        SET
            full_name = ?,
            email = ?
        WHERE id = 1
    `).run(
        full_name || "",
        email || ""
    );

    res.json({
        success: true
    });
});


/* ========================================
   Clients
======================================== */

app.get("/api/clients", (req, res) => {

    const clients = db
        .prepare(`
            SELECT *
            FROM clients
            ORDER BY id DESC
        `)
        .all();

    res.json(clients);
});


app.post("/api/clients", (req, res) => {

    const {
        name,
        company,
        email,
        phone,
        notes
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Client name is required."
        });
    }

    const result = db
        .prepare(`
            INSERT INTO clients (
                name,
                company,
                email,
                phone,
                notes
            )
            VALUES (?, ?, ?, ?, ?)
        `)
        .run(
            name.trim(),
            company || "",
            email || "",
            phone || "",
            notes || ""
        );

    res.status(201).json({
        id: result.lastInsertRowid
    });
});


app.put("/api/clients/:id", (req, res) => {

    const {
        name,
        company,
        email,
        phone,
        notes
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Client name is required."
        });
    }

    const result = db
        .prepare(`
            UPDATE clients
            SET
                name = ?,
                company = ?,
                email = ?,
                phone = ?,
                notes = ?
            WHERE id = ?
        `)
        .run(
            name.trim(),
            company || "",
            email || "",
            phone || "",
            notes || "",
            req.params.id
        );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Client not found."
        });
    }

    res.json({
        success: true
    });
});


/* ========================================
   Projects
======================================== */

app.get("/api/projects", (req, res) => {

    const projects = db
        .prepare(`
            SELECT
                projects.*,
                clients.name AS client_name
            FROM projects
            LEFT JOIN clients
                ON projects.client_id = clients.id
            ORDER BY projects.id DESC
        `)
        .all();

    res.json(projects);
});


app.post("/api/projects", (req, res) => {

    const {
        name,
        client_id,
        description,
        start_date,
        deadline,
        status
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Project name is required."
        });
    }

    const result = db
        .prepare(`
            INSERT INTO projects (
                name,
                client_id,
                description,
                start_date,
                deadline,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
            name.trim(),
            client_id || null,
            description || "",
            start_date || null,
            deadline || null,
            status || "planning"
        );

    res.status(201).json({
        id: result.lastInsertRowid
    });
});


app.put("/api/projects/:id", (req, res) => {

    const {
        name,
        client_id,
        description,
        start_date,
        deadline,
        status
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Project name is required."
        });
    }

    const result = db
        .prepare(`
            UPDATE projects
            SET
                name = ?,
                client_id = ?,
                description = ?,
                start_date = ?,
                deadline = ?,
                status = ?
            WHERE id = ?
        `)
        .run(
            name.trim(),
            client_id || null,
            description || "",
            start_date || null,
            deadline || null,
            status || "planning",
            req.params.id
        );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Project not found."
        });
    }

    res.json({
        success: true
    });
});


/* ========================================
   Tasks
======================================== */

app.get("/api/tasks", (req, res) => {

    const tasks = db
        .prepare(`
            SELECT
                tasks.*,
                projects.name AS project_name
            FROM tasks
            LEFT JOIN projects
                ON tasks.project_id = projects.id
            ORDER BY tasks.id DESC
        `)
        .all();

    res.json(tasks);
});


app.post("/api/tasks", (req, res) => {

    const {
        title,
        project_id,
        description,
        status,
        deadline
    } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required."
        });
    }

    const result = db
        .prepare(`
            INSERT INTO tasks (
                project_id,
                title,
                description,
                status,
                deadline
            )
            VALUES (?, ?, ?, ?, ?)
        `)
        .run(
            project_id || null,
            title.trim(),
            description || "",
            status || "pending",
            deadline || null
        );

    res.status(201).json({
        id: result.lastInsertRowid
    });
});


app.put("/api/tasks/:id", (req, res) => {

    const {
        title,
        project_id,
        description,
        status,
        deadline
    } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required."
        });
    }

    const result = db
        .prepare(`
            UPDATE tasks
            SET
                title = ?,
                project_id = ?,
                description = ?,
                status = ?,
                deadline = ?
            WHERE id = ?
        `)
        .run(
            title.trim(),
            project_id || null,
            description || "",
            status || "pending",
            deadline || null,
            req.params.id
        );

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    res.json({
        success: true
    });
});


/* ========================================
   Export
======================================== */

app.get("/api/export", (req, res) => {

    const data = {
        account: db
            .prepare("SELECT * FROM account")
            .all(),

        clients: db
            .prepare("SELECT * FROM clients")
            .all(),

        projects: db
            .prepare("SELECT * FROM projects")
            .all(),

        tasks: db
            .prepare("SELECT * FROM tasks")
            .all()
    };

    res.json(data);
});


/* ========================================
   Clear Data
======================================== */

app.delete("/api/data", (req, res) => {

    db.prepare("DELETE FROM tasks").run();
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM clients").run();

    db.prepare(`
        UPDATE account
        SET
            full_name = '',
            email = ''
        WHERE id = 1
    `).run();

    res.json({
        success: true
    });
});


/* ========================================
   Start Server
======================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `DOFSKY running at http://localhost:${PORT}`
        );

        console.log(
            "SQLite database connected."
        );

        console.log(
            "DOFSKY database is ready."
        );
    }
);