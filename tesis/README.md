# Tesis — LaTeX local + Overleaf

## Estructura de carpetas

```
tesis/
├── main.tex              ← documento principal (compilar este)
├── preamble.tex          ← todos los \usepackage y configuración
├── bibliography.bib      ← referencias bibliográficas
├── chapters/
│   ├── 00_caratula.tex
│   ├── 01_abstract.tex
│   ├── 02_agradecimientos.tex
│   ├── 03_introduccion.tex
│   ├── 04_estado_del_arte.tex
│   ├── 05_metodologia.tex
│   ├── 06_desarrollo.tex
│   ├── 07_resultados.tex
│   └── 08_conclusiones.tex
├── figures/              ← imágenes (.png, .pdf, .jpg)
└── assets/               ← logos, iconos, etc.
```

---

## Compilar localmente

### Opción A — latexmk (recomendado, todo automático)

```powershell
cd c:\TesisMCD\tesis
latexmk -pdf main.tex
```

Para limpiar archivos auxiliares:
```powershell
latexmk -c
```

### Opción B — pdflatex manual (secuencia completa)

```powershell
pdflatex main.tex
biber main
pdflatex main.tex
pdflatex main.tex
```

> **Nota:** si es la primera vez, MiKTeX puede tardar unos minutos
> descargando paquetes automáticamente al compilar.

---

## Ver el PDF generado

El archivo de salida es `main.pdf` en la misma carpeta `tesis/`.
Podés abrirlo con cualquier lector de PDF (Edge, Adobe Reader, etc.).

Con la extensión **LaTeX Workshop** de VS Code (ver más abajo) el PDF
se actualiza automáticamente al guardar.

---

## Extensión recomendada en VS Code

**LaTeX Workshop** (`james-yu.latex-workshop`)
- Proporciona syntax highlight, compilación al guardar y visor de PDF integrado.
- Instalar desde Extensions o ejecutar:
  ```
  code --install-extension james-yu.latex-workshop
  ```

---

## Subir a Overleaf

1. Ir a <https://www.overleaf.com> → **New Project** → **Upload Project**.
2. Comprimir toda la carpeta `tesis/` en un ZIP:
   ```powershell
   Compress-Archive -Path "c:\TesisMCD\tesis\*" -DestinationPath "c:\TesisMCD\tesis_overleaf.zip"
   ```
3. Subir el ZIP a Overleaf.
4. En Overleaf, asegurarse de que el compilador sea **pdfLaTeX** y el
   archivo principal sea `main.tex`.

---

## Bajar cambios desde Overleaf al local

1. En Overleaf: **Menu** → **Download** → **Source (.zip)**.
2. Descomprimir el ZIP reemplazando los archivos en `c:\TesisMCD\tesis\`.

---

## Flujo de trabajo recomendado

- Escribir y editar en VS Code localmente.
- Compilar con `latexmk -pdf main.tex` para ver el PDF.
- Subir a Overleaf cuando necesites compartir con tu director.
- Bajar cambios de Overleaf antes de retomar el trabajo local.
