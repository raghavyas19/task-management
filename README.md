# Task Management App

A full-stack task management application built with React (Vite, TypeScript, Tailwind CSS) for the frontend and Node.js (Express, MongoDB) for the backend. The project is fully containerized using Docker and supports local development and production deployment.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Setup Instructions](#setup-instructions)
  - [Local Development (without Docker)](#local-development-without-docker)
  - [Using Docker](#using-docker)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Overview](#api-overview)
- [License](#license)

---

## Features
- User authentication (register/login)
- Task CRUD (create, read, update, delete)
- User management (admin)
- Filtering and searching tasks
- Responsive UI with Tailwind CSS
- Toast notifications and modals
- File uploads (for task attachments)

---

## Project Structure
```
root/
│  docker-compose.yml
│  README.md
├─ client/           # Frontend (React, Vite, TypeScript)
│    ├─ src/
│    │   ├─ components/   # UI and feature components
│    │   ├─ hooks/        # Custom React hooks
│    │   ├─ types/        # TypeScript types
│    │   ├─ utils/        # Utility functions/constants
│    │   └─ ...
│    ├─ public/
│    └─ ...
├─ server/           # Backend (Node.js, Express, MongoDB)
│    ├─ controllers/  # Route controllers
│    ├─ middleware/   # Express middleware
│    ├─ models/       # Mongoose models
│    ├─ routes/       # API routes
│    ├─ utils/        # Utility functions
│    ├─ uploads/      # Uploaded files
│    └─ ...
```

---

## Design Decisions
- **Monorepo**: Both frontend and backend are in a single repository for easier management and deployment.
- **Vite + React + TypeScript**: Fast development, type safety, and modern tooling.
- **Express + MongoDB**: Simple, scalable backend with JWT authentication.
- **Dockerized**: Ensures consistent environments for development and production.
- **Modular Structure**: Components, hooks, and utilities are organized for scalability and maintainability.

---

## Setup Instructions

### Local Development (without Docker)

#### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local or Atlas)

#### 1. Clone the repository
```sh
git clone https://github.com/raghavyas19/task-management.git
cd task-management
```

#### 2. Install dependencies
```sh
cd client
npm install
cd ../server
npm install
```


#### 3. Configure environment variables
- **Backend:** Copy `.env.example` to `.env` in the `server/` directory and fill in the required values (MongoDB URI, JWT secret, etc).
- **Frontend:** Copy `.env.example` to `.env` in the `client/` directory and set the `VITE_API_URL` to match your backend API URL (e.g., `http://localhost:5000/api`).

#### 4. Start the backend
```sh
cd server
npm start
```

#### 5. Start the frontend
```sh
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

### Using Docker

#### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

#### 1. Build and start all services
From the project root:
```sh
docker-compose up --build
```
- This will build and start both the frontend and backend containers.
- The backend will connect to a MongoDB instance (configure in `docker-compose.yml`).

#### 2. Access the app
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

#### 3. Stopping the services
```sh
docker-compose down
```

---


## Environment Variables

### Backend (`server/.env`)
- Copy `server/.env.example` to `server/.env` and fill in the required values:
  - `MONGO_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret for JWT authentication
  - `PORT`: Backend server port (default: 5000)

### Frontend (`client/.env`)
- Copy `client/.env.example` to `client/.env` and fill in the required values:
  - `VITE_API_URL`: The base URL for the backend API (e.g., `http://localhost:5000/api`)

> Both the frontend and backend require their own `.env` files for configuration. See the respective `.env.example` files for all available options.

---

## Scripts

### Frontend (`client/`)
- `npm run dev` — Start Vite dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

### Backend (`server/`)
- `npm start` — Start Express server
- `npm run dev` — Start with nodemon (if configured)

---

## API Overview
- All API routes are prefixed with `/api` (see `server/routes/`)
- Auth: `/api/auth`
- Tasks: `/api/tasks`
- Users: `/api/users`

---

## License
MIT

---

## Contact
For questions or support, open an issue or contact [raghavyas19](https://github.com/raghavyas19).
