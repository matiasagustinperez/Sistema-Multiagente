# MACAU — Sistema Multiagente de Apoyo a la Calidad Académica Universitaria

> Plataforma de gestión académica que combina agentes LLM, integración con Google Drive y controles de calidad automáticos para asistir en la elaboración y revisión de programas analíticos universitarios.

---

## Descripción general

MACAU es un sistema de escritorio (ejecución local) desarrollado como trabajo final de Maestría en Ciencias de Datos. Asiste a directores de carrera, docentes y comisiones curriculares en la elaboración, revisión y control de programas analíticos, con soporte de inteligencia artificial generativa y mecanismos de control de calidad configurables.

El sistema implementa una arquitectura multiagente donde distintos componentes especializados colaboran para: asistir la redacción con IA, verificar el cumplimiento de estándares académicos, sincronizar documentos con Google Drive/Docs, gestionar notificaciones institucionales y mantener trazabilidad del proceso.

---

## Funcionalidades principales

### Gestión de propuestas analíticas
- Carga y edición estructurada de programas analíticos por asignatura
- Campos: fundamentación, contenidos mínimos, resultados de aprendizaje, unidades, trabajos prácticos, metodología, evaluación y bibliografía
- Estados de propuesta: En proceso / Completada / Cerrada para edición
- Importación desde documentos Word (.docx) o desde Google Docs (por URL)
- Exportación en formato DOCX, PDF, JSON y XML

### Asistencia con inteligencia artificial
- Generación de contenido desde cero por sección (metodología, evaluación, RAs, unidades, fundamentación, bibliografía)
- Reformulación de texto existente preservando los datos originales
- Corrección ortográfica y gramatical
- Los controles inteligentes activos se incorporan automáticamente al prompt de generación

### Controles inteligentes (LLM)
- Controles académicos configurables por tópico (evaluación, bibliografía, metodología, RAs, etc.)
- Tres modos de ejecución con distintos modelos y parámetros:
  - **Guepardo** — rápido y económico (gpt-4o-mini, baja temperatura)
  - **Delfín** — equilibrado (gpt-4o-mini, temperatura media)
  - **Ballena** — exhaustivo y preciso (gpt-4o, mayor contexto)
- Resultados con veredicto, descripción del fallo, sugerencia y texto propuesto
- Posibilidad de aplicar sugerencias directamente sobre la propuesta

### Controles rápidos (basados en reglas)
- Verificaciones deterministas sin llamadas a LLM
- Configurables por institución y plan de estudios

### Integración con Google Drive y Gmail
- Creación de documentos en Drive vinculados a cada propuesta
- Sincronización bidireccional: detección de cambios y aplicación selectiva
- Envío de notificaciones institucionales por Gmail a docentes
- Autenticación OAuth2 con renovación de token

### Gestión de planes de estudio
- Carga y administración de planes de carrera con años, cuatrimestres y asignaturas
- Importación de planes desde archivos Excel (.xlsx)
- Matriz de tributación de competencias
- Gestión de correlatividades

### Módulo de acreditación
- Registro y seguimiento de evidencias para procesos CONEAU
- Plan de trabajo con actividades y tareas
- Auditoría y versiones de evidencias

### Autenticación y roles
- Login con JWT y bcrypt
- Roles: Director de carrera, Docente, Comisión curricular (solo lectura), Administrador
- Recuperación de contraseña por correo electrónico

---

## Arquitectura técnica

```
MACAU/
├── backend/                    # Servidor FastAPI (Python)
│   ├── app/
│   │   ├── main.py            # Todos los endpoints de la API REST
│   │   ├── models.py          # Modelos SQLAlchemy (SQLite)
│   │   ├── schemas.py         # Esquemas Pydantic
│   │   ├── database.py        # Configuración de base de datos
│   │   ├── auth.py            # Autenticación JWT / bcrypt
│   │   ├── docx_import.py     # Importación desde Word
│   │   └── docx_export.py     # Exportación a Word/PDF
│   ├── agents/
│   │   └── extract.py         # Extracción de embeddings vectoriales
│   ├── scripts/
│   │   └── generate_google_refresh_token.py  # Renovación OAuth2
│   ├── requirements.txt
│   └── .env                   # Variables de entorno (no incluido en repo)
│
└── frontend/                  # Interfaz React + Vite
    ├── src/
    │   ├── App.jsx            # Componente principal (SPA completa)
    │   └── main.jsx           # Punto de entrada
    └── package.json
```

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Base de datos | SQLite + SQLAlchemy 2.0 |
| Inteligencia artificial | OpenAI API (gpt-4o, gpt-4o-mini) + embeddings |
| Búsqueda vectorial | hnswlib / numpy fallback |
| Integración Google | Drive API v3, Gmail API, OAuth2 |
| Autenticación | JWT (PyJWT) + bcrypt |
| Exportación | python-docx, docx2pdf, pypdfium2 |
| Frontend | React 18, Vite |
| Comunicación | REST API JSON, CORS configurado |

---

## Requisitos previos

- Python 3.11 o superior
- Node.js 18 o superior
- Clave de API de OpenAI (con acceso a gpt-4o-mini y gpt-4o)
- Credenciales OAuth2 de Google (para Drive y Gmail) — opcionales

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```powershell
git clone https://github.com/matiasagustinperez/Sistema-Multiagente.git
cd Sistema-Multiagente
```

### 2. Configurar el entorno del backend

```powershell
cd backend

# Crear entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crear el archivo `backend/.env` con el siguiente contenido:

```env
OPENAI_API_KEY=sk-...tu-clave...
SECRET_KEY=una-clave-secreta-larga-y-aleatoria

# Google OAuth2 (opcional — requerido para Drive y Gmail)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
```

### 4. Inicializar la base de datos

```powershell
# Desde backend/ con el entorno activado
python init_db.py
```

### 5. Instalar dependencias del frontend

```powershell
cd ..\frontend
npm install
```

### 6. Iniciar los servidores

**Backend** (puerto 8011):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8011
```

**Frontend** (puerto 5173):

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

La aplicación estará disponible en: **http://127.0.0.1:5173**

La documentación interactiva de la API en: **http://127.0.0.1:8011/docs**

---

## Inicio rápido con VS Code

El repositorio incluye tareas de VS Code preconfiguradas. Desde la paleta de comandos (`Ctrl+Shift+P → Tasks: Run Task`):

- **Start Backend (PowerShell)** — inicia el backend en el puerto 8011
- **Start Frontend** — inicia el frontend en el puerto 5173

---

## Variables de entorno de referencia

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `OPENAI_API_KEY` | Clave de API de OpenAI | Sí |
| `SECRET_KEY` | Clave para firma de tokens JWT | Sí |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth2 de Google | Solo para Drive/Gmail |
| `GOOGLE_CLIENT_SECRET` | Secreto OAuth2 de Google | Solo para Drive/Gmail |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Token de refresco OAuth2 | Solo para Drive/Gmail |

---

## Licencia y autoría

Desarrollado como trabajo final de la Maestría en Ciencias de Datos — 2025/2026.

Autor: Matías Agustín Pérez
