# Fichas de estudio pruebas Saber

Base modular del proyecto, separada en archivos para facilitar mantenimiento y ampliación.

## Estructura
- `index.html`: estructura principal de la SPA.
- `styles.css`: estilos visuales.
- `database.js`: banco de fichas cargado como `window.DATABASE`.
- `app.js`: lógica de filtros, navegación, respuesta y retroalimentación.

## Cómo usar
1. Descarga y descomprime la carpeta.
2. Abre `index.html` en tu navegador.
3. Para ampliar temas, agrega nuevas fichas en `database.js` siguiendo la misma estructura.

## Siguiente paso recomendado
Migrar `database.js` a `database.json` y cargarlo dinámicamente, para poder escalar por módulos o áreas.
