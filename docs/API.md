# API de Palomas Live

Esto es lo que el frontend espera del backend. Todas las llamadas están en
[`frontend/js/api.js`](../frontend/js/api.js). Para conectar el backend, en ese archivo:

```js
const USAR_SERVIDOR = true;
const URL_API = 'http://localhost:3000/api'; // la dirección de tu servidor
```

## Reglas que el backend DEBE cumplir

1. **Contraseñas**: nunca se guardan tal cual. Guárdalas con hash (por ejemplo `bcrypt`).
2. **Token**: al iniciar sesión el servidor regresa un `token`. El frontend lo manda en cada
   llamada como `Authorization: Bearer <token>`. Si el token no sirve, responde `401`.
3. **Roles**: el servidor revisa el rol en cada ruta. Las rutas marcadas *admin* responden
   `403` si las pide un usuario. Ocultar botones en la página no protege nada; esto sí.
4. **Usuarios sin puntos**: `/mis-hojas` nunca manda la columna `puntos`, y solo regresa las
   hojas del jugador ligado a ese token (no se recibe el nombre desde el navegador).
5. **Errores**: responde `{ "error": "mensaje para mostrar" }` con un código 4xx/5xx.
   El frontend muestra ese mensaje tal cual.
6. **Mismas cuentas**: usa las reglas de [`frontend/js/calculos.js`](../frontend/js/calculos.js)
   (comisión del 10%, nombres sin importar mayúsculas ni acentos).

## Datos

**Día** (lo que se captura):

```json
{
  "fecha": "2026-10-24",
  "peleas": [
    { "apuestas": [
      { "nombre": "Juan", "puntos": 10000, "resultado": "gana" },
      { "nombre": "Pedro", "puntos": 5000, "resultado": "pierde" }
    ] }
  ]
}
```

Los puntos se guardan completos (10000), aunque en la captura se escriban en miles (10).

**Hoja** (de una persona en un día):

```json
{
  "fecha": "2026-10-24",
  "nombre": "Juan",
  "filas": [
    { "no": "P1", "pierde": 0, "puntos": 10000, "gana": 9000 },
    { "no": "P2", "pierde": 5000, "puntos": 0, "gana": 0 }
  ],
  "totalPierde": 5000,
  "totalGana": 9000,
  "total": 4000,
  "participo": true
}
```

**Usuario** (nunca incluye la contraseña):

```json
{ "id": 7, "usuario": "juan24", "nombre": "Juan", "rol": "usuario" }
```

## Rutas

| Método | Ruta | Quién | Recibe | Responde |
|---|---|---|---|---|
| POST | `/login` | todos | `{ usuario, contrasena }` | `{ token, usuario }` · `401` si no coincide |
| GET | `/dias/:fecha` | admin | – | Día · `404` si no existe |
| PUT | `/dias/:fecha` | admin | Día | Día guardado (crea o reemplaza) |
| GET | `/jugadores` | admin | – | `["Juan", "Pedro", …]` |
| GET | `/hojas?nombre=Juan` | admin | – | `[Hoja]` de la más nueva a la más vieja, solo días en que jugó |
| GET | `/mis-hojas` | usuario | – | `[Hoja]` del jugador ligado al token, **sin `puntos`** |
| GET | `/comisiones?desde=&hasta=` | admin | fechas opcionales | `[{ nombre, ganado, comision }]` de mayor a menor |
| GET | `/usuarios` | admin | – | `[Usuario]` |
| POST | `/usuarios` | admin | `{ nombre, usuario, contrasena }` | Usuario creado (rol siempre `usuario`) · `409` si el usuario ya existe |
| PUT | `/usuarios/:id/contrasena` | admin | `{ contrasena }` | `204` |
| DELETE | `/usuarios/:id` | admin | – | `204` |

**Comisiones**: por cada persona se suman los `puntos` de sus apuestas con resultado `gana`
(`ganado`) y `comision = ganado × 0.10`. Las apuestas perdidas no cuentan.

## Tablas sugeridas para la base de datos

```
usuarios  (id, usuario UNIQUE, contrasena_hash, nombre, rol, creado_en)
dias      (fecha PRIMARY KEY, creado_en, actualizado_en)
peleas    (id, fecha → dias, numero)
apuestas  (id, pelea_id → peleas, nombre, puntos, resultado 'gana'|'pierde')
```

Con esto las hojas y las comisiones se calculan con consultas, no hace falta guardarlas.
