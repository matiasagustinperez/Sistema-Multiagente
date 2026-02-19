# ARCHITECTURE.md

## Módulos principales
- backend/app: API FastAPI, lógica de importación, modelos y DB.
- frontend/src: React, UI para importar y consultar propuestas.
- backend/agents: Extracción y procesamiento de datos de documentos.

## Flujo principal
1. Usuario sube DOCX o pega URL de Google Docs en el frontend.
2. Frontend envía archivo/URL al backend.
3. Backend procesa el documento, extrae datos y guarda en DB.
4. Frontend muestra previsualización y permite guardar.

## Dependencias clave
- Python: fastapi, sqlalchemy, pydantic, requests, python-dotenv, openai
- Node.js: react, vite
- DB: SQLite (por defecto)

## Integraciones
- API REST entre frontend y backend.
- Acceso a base de datos relacional.

## Diagrama (Mermaid)
```mermaid
graph TD
  A[Usuario] -->|Sube DOCX/URL| B[Frontend React]
  B -->|POST /proposals/import| C[Backend FastAPI]
  C -->|Procesa y guarda| D[(DB)]
  C -->|Extrae datos| E[Agentes]
  B <--|Respuesta/previsualización| C
```

## TODO
- Documentar endpoints REST.
- Agregar detalles de modelos DB.
