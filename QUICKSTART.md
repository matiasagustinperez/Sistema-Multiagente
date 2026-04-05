# MACAU — Inicio rápido

Guía mínima para tener el sistema en funcionamiento en menos de 5 minutos, asumiendo que ya están instalados Python 3.11+ y Node.js 18+.

---

## Requisitos previos

```powershell
python --version   # debe ser 3.11 o superior
node --version     # debe ser 18 o superior
```

---

## Paso 1 — Configurar el entorno del backend

```powershell
cd C:\TesisMCD\backend

# Crear y activar entorno virtual (solo la primera vez)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt
```

---

## Paso 2 — Crear el archivo de configuración

Crear el archivo `backend/.env` (nunca se sube al repositorio):

```env
OPENAI_API_KEY=sk-...tu-clave-de-openai...
SECRET_KEY=una-clave-larga-y-aleatoria-para-jwt

# Solo si se usa Drive o Gmail:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
```

---

## Paso 3 — Inicializar la base de datos (solo la primera vez)

```powershell
# Desde backend/ con el entorno activado
python init_db.py
```

---

## Paso 4 — Instalar el frontend (solo la primera vez)

```powershell
cd C:\TesisMCD\frontend
npm install
```

---

## Paso 5 — Iniciar los servidores

Abrir dos terminales:

**Terminal 1 — Backend:**

```powershell
cd C:\TesisMCD\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```

**Terminal 2 — Frontend:**

```powershell
cd C:\TesisMCD\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## Acceso

| Servicio | URL |
|----------|-----|
| Aplicación | http://127.0.0.1:5173 |
| API (docs interactivos) | http://127.0.0.1:8011/docs |

---

## Usando VS Code

Las tareas ya están configuradas en el repositorio. Ejecutar con `Ctrl+Shift+P → Tasks: Run Task`:

- **Start Backend (PowerShell)**
- **Start Frontend**

---

## Verificación de estado

```powershell
# Desde la raíz del proyecto
.\health-check.ps1
```

---

Para documentación detallada del sistema, ver [README.md](./README.md).
