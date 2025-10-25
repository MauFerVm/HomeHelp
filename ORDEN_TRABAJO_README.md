# Sistema de Órdenes de Trabajo

## Descripción General

Este documento describe el flujo de creación de órdenes de trabajo en el sistema HomeHelp.

## Flujo de Creación

Cuando un cliente confirma un horario para un presupuesto, el sistema automáticamente:

1. **Crea una entrada en la agenda del profesional**
2. **Actualiza el estado del presupuesto a "aceptado"**
3. **Genera una orden de trabajo completa**

## Estructura de la Orden de Trabajo

La tabla `orden_de_trabajo` contiene los siguientes campos:

| Campo | Tipo | Descripción | Origen del Dato |
|-------|------|-------------|-----------------|
| `id` | INT | Identificador único | Auto-generado |
| `presupuesto_id` | INT | ID del presupuesto aceptado | Del presupuesto seleccionado |
| `solicitud_id` | INT | ID de la solicitud original | Del presupuesto |
| `profesional_id` | INT | ID del profesional (tabla persona) | De la tabla profesional |
| `cliente_persona_id` | INT | ID del cliente (tabla persona) | De la solicitud |
| `monto` | DECIMAL(12,2) | Monto acordado | Del presupuesto |
| `descripcion` | TEXT | Descripción del trabajo | Del presupuesto |
| `fecha_programada` | DATE | Fecha del trabajo | Seleccionado por el cliente en el calendario |
| `horarioInicio` | TIME | Hora de inicio | Seleccionado por el cliente en el calendario |
| `horaFin` | TIME | Hora de finalización | Seleccionado por el cliente en el calendario |
| `estado` | ENUM | Estado actual de la orden | 'pendiente' (por defecto) |
| `is_active` | TINYINT(1) | Si la orden está activa | 1 (por defecto) |
| `previous_orden_id` | INT | ID de orden anterior (si aplica) | NULL (primera orden) |
| `creado_en` | DATETIME | Fecha de creación | NOW() (auto-generado) |

## Estados Posibles

La orden de trabajo puede tener los siguientes estados:

- **pendiente**: La orden fue creada y está esperando
- **represupuestada**: Se necesita un nuevo presupuesto
- **en_curso**: El trabajo está en progreso
- **completado**: El trabajo fue finalizado
- **cancelado**: La orden fue cancelada
- **reprogramado**: La orden fue reprogramada para otra fecha

## Endpoints de API

### Crear Orden de Trabajo
**Automático** - Se crea al confirmar un horario:
```
POST /api/horarios/presupuesto/:presupuestoId/confirmar
Body: {
  fecha: "YYYY-MM-DD",
  horaInicio: "HH:MM",
  horaFin: "HH:MM"
}
```

### Consultar Órdenes de Trabajo

#### Por ID
```
GET /api/ordenes/:ordenId
```

#### Por Profesional
```
GET /api/ordenes/profesional/:profesionalId
```

#### Por Cliente
```
GET /api/ordenes/cliente/:clienteId
```

### Actualizar Estado
```
PUT /api/ordenes/:ordenId/estado
Body: {
  estado: "en_curso" | "completado" | "cancelado" | etc.
}
```

## Archivos del Sistema

### Backend

1. **Modelo**: `server/models/ordenTrabajoModel.js`
   - Define las operaciones de base de datos

2. **Controlador**: `server/controllers/ordenTrabajoController.js`
   - Maneja la lógica de negocio

3. **Rutas**: `server/routes/ordenTrabajoRoutes.js`
   - Define los endpoints de la API

4. **Integración**: `server/controllers/horarioController.js`
   - La función `confirmarHorario` crea la orden de trabajo

### Frontend

- **Vista**: `client/src/features/dashboard/MisPresupuestos.jsx`
  - Interfaz donde el cliente acepta el presupuesto y selecciona el horario

## Transacciones de Base de Datos

La creación de una orden de trabajo se realiza dentro de una transacción que incluye:

1. Creación de entrada en `profesional_agenda`
2. Actualización del estado en `presupuesto`
3. Creación del registro en `orden_de_trabajo`

Si alguno de estos pasos falla, toda la operación se revierte (ROLLBACK).

## Notas Importantes

- Todas las órdenes nuevas se crean con `estado = 'pendiente'`
- El campo `is_active = 1` indica que la orden está activa
- El campo `previous_orden_id` es NULL para órdenes nuevas (se usa para reprogramaciones)
- La fecha y hora se validan antes de crear la orden para asegurar disponibilidad
- El sistema verifica que el presupuesto esté en estado "enviado" antes de proceder

## Ejemplo de Respuesta del Servidor

Cuando se confirma exitosamente un horario:

```json
{
  "success": true,
  "message": "Horario confirmado y orden de trabajo creada exitosamente",
  "data": {
    "agendaId": 123,
    "presupuestoId": 456,
    "ordenTrabajoId": 789,
    "fecha": "2025-10-30",
    "horaInicio": "10:00",
    "horaFin": "12:00"
  }
}
```


