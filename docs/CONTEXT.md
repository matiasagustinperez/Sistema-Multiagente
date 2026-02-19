# CONTEXT.md

## ¿Qué es el proyecto?
TesisMCD es una plataforma para la gestión y análisis de propuestas académicas (programas de materias, clases, etc.) orientada a carreras universitarias.

## Objetivo
- Facilitar la importación, almacenamiento y consulta de propuestas docentes.
- Permitir la extracción automática de datos desde archivos DOCX y Google Docs públicos.
- Centralizar la información para docentes y administradores.

## Alcance
- Importación de propuestas vía DOCX y Google Docs URL.
- Almacenamiento en base de datos relacional.
- Interfaz web para gestión y consulta.

## Estado actual
- Backend (FastAPI) y frontend (React) funcionando localmente.
- Importación desde Google Docs y DOCX implementada.
- Persistencia en base de datos activa.

## Supuestos
- Los documentos de Google Docs a importar son públicos.
- El entorno de ejecución es local (Windows, Python 3.13, Node.js).

## Limitaciones
- No hay autenticación de usuarios implementada.
- No hay despliegue en la nube.
- El procesamiento de archivos depende del formato esperado.
- TODO: completar detalles de escalabilidad y seguridad.
