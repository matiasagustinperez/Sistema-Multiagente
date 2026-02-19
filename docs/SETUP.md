# SETUP.md

## Requisitos
- Python >= 3.10 (recomendado 3.13)
- Node.js >= 18
- npm >= 9
- Git

## Variables de entorno
- backend/.env: claves API, configuración DB, etc.
- TODO: listar variables obligatorias

## Instalación
```sh
# Clonar el repo
git clone <REPO_URL>
cd TesisMCD

# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

## Quickstart
```sh
# Backend
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# Frontend
cd ../frontend
npm run dev
```

## Comandos útiles
- Ejecutar tests: TODO
- Lint: TODO
- Build frontend: npm run build

## Ejecución local
- Backend: http://127.0.0.1:8001
- Frontend: http://localhost:5173
