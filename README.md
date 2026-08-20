# Vehicle Service & Workshop Management System

An industry-level vehicle service and workshop management system for managing customers, vehicles, service orders, parts, invoicing, and workshop workflows.

## Project overview

This repository contains a full-stack application with a Python/FastAPI backend and a React frontend. The system supports:

- Customer and vehicle records
- Work orders, tasks, and assignments
- Parts and inventory management
- Estimates and invoicing
- Authentication (JWT)
- REST APIs consumed by the React frontend

The code is organized into a backend and a frontend folder. The frontend contains React components, UI layout, and optional visual background components (Silk / Ferrofluid) with graceful CSS fallbacks so the app works even if those optional packages are not installed.

## Technology stack

- Backend: Python, FastAPI, SQLAlchemy, PostgreSQL (primary), MongoDB (optional)
- Frontend: React (JSX), existing code in `frontend/` (not all files use TypeScript yet)
- Authentication: JWT
- Testing: pytest (backend)
- Containerization / deployment: Docker (optional)

## Quick start (development)

Prerequisites

- Node.js (16+ recommended) and npm (or pnpm/yarn)
- Python 3.10+ with virtualenv (recommended)
- PostgreSQL (or a running DB instance) if you intend to run the full backend

Backend

1. Create and activate a Python virtual environment:

   Windows (PowerShell):
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install backend dependencies (from project root):

   ```powershell
   pip install -r backend/requirements.txt
   ```

3. Configure environment variables (example):

   - DATABASE_URL: PostgreSQL connection string (e.g. postgresql://user:pass@localhost:5432/dbname)
   - SECRET_KEY: JWT secret

4. Run migrations / create schema (project-specific – consult backend README or migration folder if present).

5. Start the backend dev server (from the backend folder):

   ```powershell
   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

Frontend

1. Install frontend dependencies and start dev server:

   Windows (PowerShell):

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   The app will be available at http://localhost:5173/ by default (Vite).

2. Optional animation packages

   The frontend includes optional animated background components (Silk, Ferrofluid). These components are loaded at runtime when an optional package is installed. If the package is not present, a CSS fallback visual is used automatically.

   To enable an animation package (if a published package exists), install it in the frontend folder and restart the dev server, e.g.:

   ```powershell
   cd frontend
   npm install <package-name>
   # example: npm install @your-scope/silk-package
   ```

   Note: the project includes runtime dynamic imports with Vite ignore hints so missing optional packages will not break the app — they will simply use the CSS fallback.

## UI and background animation details

- Main application layout:
  - File: [AppLayout.jsx](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/layout/AppLayout.jsx)
  - The app shell renders the background component behind the UI and mounts the sidebar and topbar.

- Silk background wrapper (optional runtime animation + CSS fallback):
  - File: [Silk.jsx](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Silk.jsx)
  - Styles: [Silk.css](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Silk.css)
  - Usage: AppLayout renders <Silk width="1080px" height="1080px" color="#6ce1c4" speed={5} scale={1} noiseIntensity={1.5} rotation={0} />
  - The component attempts to dynamically import a runtime animation package. If the runtime package is not installed the component shows a blurred radial-gradient fallback tuned to the configured color.

- Ferrofluid background wrapper (previous alternative):
  - File: [Ferrofluid.jsx](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Ferrofluid.jsx)
  - Styles: [Ferrofluid.css](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Ferrofluid.css)
  - Usage: AppLayout previously rendered Ferrofluid; the current app uses Silk but Ferrofluid remains in the codebase and behaves similarly with a runtime import + CSS fallback.

Customizing colors and size

- To change the Silk background color, update the color prop in AppLayout or Silk usage:

  File: [AppLayout.jsx](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/layout/AppLayout.jsx)

  Example:
  ```jsx
  <Silk color="#FF9FFC" width="1080px" height="1080px" />
  ```

- To change fallback visuals, edit:
  - [Silk.css](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Silk.css)
  - [Ferrofluid.css](C:/Users/abhis/vehicle-service-workshop-management/frontend/src/components/common/Ferrofluid.css)

Troubleshooting

- Vite dependency scan errors: If Vite reports missing packages for optional runtime imports, either install the package in the frontend or rely on the CSS fallback. The dynamic imports in these wrappers are intentionally constructed to avoid Vite static analysis and pre-bundling issues.

- If page layout shifts after adding a background component, ensure the background container uses `position: absolute` or `fixed` and `pointer-events: none`, and that the app shell has its own stacking context (e.g., `.app-shell { position: relative; z-index: 0; }`).

Contributing

- Run the backend and frontend locally as described above.
- Follow existing folder structure and add tests using pytest for backend.

License

Add your project license here.
