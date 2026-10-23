# API de Ventas — Documentación para clientes

API REST (Node.js + Express 5 + MySQL) que expone la información de la base de datos `db_ventas_tech`: consulta de ventas consolidadas por sucursal y año, consulta del detalle de una venta y registro de nuevas ventas.

## Información general

| Característica | Valor |
|---|---|
| URL base (local) | `http://localhost:3000` |
| Prefijo de las rutas | `/api/v1/ventas` |
| Puerto | `3000` por defecto (variable de entorno `PORT`) |
| Formato de datos | JSON (`Content-Type: application/json`) |
| Autenticación | No requiere |
| Versión | v1 |

> Todas las rutas descritas a continuación son relativas a `http://localhost:3000/api/v1/ventas`.

## Resumen de endpoints

| Método | Ruta | Descripción | Éxito |
|---|---|---|---|
| `GET` | `/consolidado` | Ventas consolidadas por sucursal y año | `200 OK` |
| `GET` | `/:id` | Detalle de una venta por su id | `200 OK` |
| `POST` | `/` | Registra una nueva venta | `201 Created` |

---

## 1. Consultar ventas consolidadas

Devuelve las ventas filtradas por sucursal y año.

```
GET /api/v1/ventas/consolidado?sucursal={sucursal}&anio={anio}
```

### Parámetros de consulta (query string)

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `sucursal` | número | Sí | Identificador de la sucursal. `0` = todas las sucursales. |
| `anio` | número | Sí | Año a consultar (por ejemplo `2026`). `0` = todos los años. |

> Ambos parámetros son obligatorios. Un año distinto de `0` e inferior o igual a `2000` devuelve un resultado vacío.

### Ejemplo de solicitud

```bash
curl "http://localhost:3000/api/v1/ventas/consolidado?sucursal=1&anio=2026"
```

### Respuesta exitosa — `200 OK`

```json
{
  "status": "success",
  "total_registros": 2,
  "data": [
    { "...": "una fila por venta; las columnas las define el procedimiento almacenado" },
    { "...": "..." }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | string | Siempre `"success"` si la consulta fue correcta. |
| `total_registros` | número | Cantidad de filas devueltas en `data`. |
| `data` | arreglo | Filas de ventas. Si no hay coincidencias, `[]` y `total_registros: 0`. |

### Errores

| Código | Cuándo ocurre | Cuerpo |
|---|---|---|
| `400` | Falta `sucursal` o `anio` | `{"error":"Bad Request","message":"Debe enviar ambos parámetros"}` |
| `500` | Falla en la base de datos | `{"error":"Internal Server Error","message":"Error en MySQL"}` |

---

## 2. Consultar el detalle de una venta

Devuelve la información de una venta específica: fecha, cliente, ciudad del cliente, producto, cantidad y monto.

```
GET /api/v1/ventas/{id}
```

### Parámetros de ruta

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | entero | Sí | Identificador de la venta. |

### Ejemplo de solicitud

```bash
curl "http://localhost:3000/api/v1/ventas/15"
```

### Respuesta exitosa — `200 OK`

`data` contiene **un único objeto** con el detalle de la venta (no un arreglo).

```json
{
  "status": "success",
  "data": {
    "fecha": "2026-10-05",
    "cliente": "Nombre del cliente",
    "ciudad": "Santiago",
    "producto": "Nombre del producto",
    "cantidad": 2,
    "monto": 49990
  }
}
```

> Los nombres exactos de las columnas los define el procedimiento almacenado `sp_venta_id`; el ejemplo es ilustrativo.

### Errores

| Código | Cuándo ocurre | Cuerpo |
|---|---|---|
| `404` | No existe una venta con ese id | `{"error":"Not Found","message":"No existe una venta con id 999"}` |
| `500` | Falla en la base de datos (incluye ids no numéricos) | `{"error":"Internal Server Error","message":"Error en MySQL"}` |

---

## 3. Registrar una venta

Crea una nueva venta en la base de datos.

```
POST /api/v1/ventas
```

### Encabezados

| Encabezado | Valor |
|---|---|
| `Content-Type` | `application/json` |

### Cuerpo de la solicitud (JSON)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id_producto` | número | Sí | Id de un producto existente. |
| `id_cliente` | número | Sí | Id de un cliente existente. |
| `cantidad` | número | Sí | Unidades vendidas (mayor que 0). |
| `fecha_venta` | string | Sí | Fecha de la venta, formato `YYYY-MM-DD`. |

Los cuatro campos son obligatorios; si falta alguno (o es `0` o vacío) la API responde `400`.

### Ejemplo de solicitud

```bash
curl -X POST "http://localhost:3000/api/v1/ventas" \
  -H "Content-Type: application/json" \
  -d '{
    "id_producto": 3,
    "id_cliente": 7,
    "cantidad": 2,
    "fecha_venta": "2026-10-22"
  }'
```

### Respuesta exitosa — `201 Created`

```json
{
  "status": "success",
  "message": "Venta registrada exitosamente",
  "datos_registrados": {
    "id_producto": 3,
    "id_cliente": 7,
    "cantidad": 2,
    "fecha_venta": "2026-10-22"
  }
}
```

### Errores

| Código | Cuándo ocurre | Cuerpo |
|---|---|---|
| `400` | Falta algún campo obligatorio | `{"error":"Bad Request","message":"Todos los parametros son obligatorios"}` |
| `500` | Falla en la base de datos (por ejemplo, producto o cliente inexistente) | `{"error":"Internal Server Error","message":"Error en MySQL"}` |

---

## Formato de errores

Todos los errores comparten la misma estructura:

```json
{
  "error": "Nombre del error HTTP",
  "message": "Descripción legible del problema"
}
```

## Códigos de estado utilizados

| Código | Significado |
|---|---|
| `200` | Consulta exitosa |
| `201` | Recurso creado |
| `400` | Solicitud inválida (faltan parámetros) |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor o de la base de datos |

---

## Ejemplos de consumo desde JavaScript

```js
const BASE_URL = 'http://localhost:3000/api/v1/ventas';

// Ventas consolidadas
async function obtenerConsolidado(sucursal, anio) {
  const res = await fetch(`${BASE_URL}/consolidado?sucursal=${sucursal}&anio=${anio}`);
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}

// Detalle de una venta
async function obtenerVenta(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error((await res.json()).message);
  return (await res.json()).data;
}

// Registrar una venta
async function registrarVenta(venta) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venta),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json();
}
```

## Notas para el consumo

- **CORS:** la API no habilita CORS. Un navegador que la consuma desde otro origen (otro dominio o puerto) será bloqueado; en ese caso se debe consumir desde un servidor o habilitar CORS en la API.
- **Sin autenticación ni límite de solicitudes:** cualquier cliente con acceso a la red puede usar los tres endpoints.
- **Enviar siempre JSON en el POST:** sin el encabezado `Content-Type: application/json` el cuerpo no se interpreta y la API responderá `400`.

---

## Ejecución del servidor (referencia para desarrolladores)

```bash
npm install
# Crear un archivo .env con:
#   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, PORT
node server.js
```

Al iniciar, el servidor muestra `Servidor Express en http://localhost:3000`.
