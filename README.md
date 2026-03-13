# SnakeSolo

Proyecto independiente con solo el juego Snake.

## Archivos
- `index.html`
- `styles.css`
- `snake-game.mjs`
- `README.md`

## Cómo abrirlo en local
En PowerShell, entra en la carpeta y ejecuta uno de estos comandos:

```powershell
cd "C:\Users\Dell Show OS Pro\Documents\Playground\SnakeSolo"
py -m http.server 8080
```

Si `py` no existe en tu equipo:

```powershell
cd "C:\Users\Dell Show OS Pro\Documents\Playground\SnakeSolo"
python -m http.server 8080
```

Luego abre:
- `http://127.0.0.1:8080/`

## Controles
- Flechas
- `WASD`
- `Space`: pausa o reanuda
- `Enter`: inicia desde `Ready` o reinicia una partida terminada

## Incluye
- tablero
- serpiente
- comida
- score
- estados `ready`, `running`, `paused` y `game-over`
- botones `Start`, `Pause` y `Restart`
- controles en pantalla

## No incluye
- Auth
- recomendaciones
- mapa
- FastAPI
- `app.js`
- ninguna otra parte de `PasaElSitio`
