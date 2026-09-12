# DOFSKY

DOFSKY is a full-stack client and project management system built with HTML, CSS, JavaScript, Node.js, Express, and SQLite.

## Live Demo

https://dofsky.onrender.com/index.html

## Overview

DOFSKY provides a centralized workspace for managing clients, projects, and tasks through a web-based dashboard.

The application combines a responsive frontend with an Express REST API and SQLite database to manage business information and project workflows.

## Key Features

### Dashboard

- Overview of clients, projects, and tasks
- Recent project and task information
- API and database health status

### Client Management

- View client records
- Add new clients
- Edit existing client information
- Store company, email, phone, and notes

### Project Management

- View projects
- Create projects
- Edit project information
- Associate projects with clients
- Store descriptions, start dates, deadlines, and project status

### Task Management

- View tasks
- Create tasks
- Edit task information
- Associate tasks with projects
- Store descriptions, deadlines, and task status

### Account Settings

- View account information
- Update account name
- Update account email

### Data Management

- Export account, client, project, and task data through the API
- Clear application data through the dedicated data-management endpoint

## Technology Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- SQLite
- better-sqlite3
- Git & GitHub
- Render

## Backend

The Express backend provides REST API endpoints for:

- Account management
- Client management
- Project management
- Task management
- Health monitoring
- Data export
- Data management

## Database

SQLite is used for persistent application data.

The database contains related tables for:

- Account
- Clients
- Projects
- Tasks

Projects can be associated with clients, and tasks can be associated with projects.

## Project Structure

```text
DOFSKY/
├── clients.html
├── database.js
├── index.html
├── package-lock.json
├── package.json
├── projects.html
├── script.js
├── server.js
├── settings.html
├── styles.css
└── tasks.html
```

## Deployment

DOFSKY is deployed as a Node.js web service on Render.

## What This Project Demonstrates

- Full-stack web application development
- REST API development with Express
- SQLite database integration
- Relational data modeling
- Client and project management workflows
- Task management
- Frontend and backend integration
- Data export and application data management
- Responsive frontend development
- Git and GitHub workflow
- Production deployment
