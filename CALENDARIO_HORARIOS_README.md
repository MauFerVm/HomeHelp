# Sistema de Calendario de Horarios - Home Help

## Descripción
Se ha implementado un sistema completo de calendario para seleccionar horarios disponibles de profesionales al aceptar presupuestos. El sistema permite:

- Ver horarios disponibles del profesional por semana
- Navegar entre semanas (máximo 4 semanas hacia adelante)
- Seleccionar horarios disponibles excluyendo días pasados y horarios ocupados
- Confirmar horarios y actualizar automáticamente la agenda del profesional

## Archivos Creados/Modificados

### Backend (Server)

#### Nuevos Archivos:
1. **`models/horarioProfesionalModel.js`** - Modelo para manejar horarios y agenda
2. **`controllers/horarioController.js`** - Controlador para la lógica de horarios
3. **`routes/horarioRoutes.js`** - Rutas de la API de horarios
4. **`scripts/insertar_horarios_ejemplo.sql`** - Script con datos de ejemplo

#### Archivos Modificados:
1. **`index.js`** - Agregadas las rutas de horarios

### Frontend (Client)

#### Nuevos Archivos:
1. **`components/CalendarioHorarios.jsx`** - Componente principal del calendario
2. **`components/CalendarioHorarios.css`** - Estilos del calendario

#### Archivos Modificados:
1. **`features/dashboard/MisPresupuestos.jsx`** - Integración del calendario con el botón "Aceptar Presupuesto"

## Estructura de Base de Datos

### Tablas Creadas:
1. **`horario_profesional`** - Versiones de horarios de profesionales
2. **`horario_dia`** - Días y franjas horarias de cada horario
3. **`profesional_agenda`** - Agenda ocupada de profesionales

## API Endpoints

### GET `/api/horarios/profesional/:profesionalId/disponibles`
Obtiene horarios disponibles de un profesional para una semana específica.

**Parámetros:**
- `profesionalId` (URL): ID del profesional
- `fechaInicio` (query): Fecha de inicio de la semana (YYYY-MM-DD)
- `duracion` (query): Duración en minutos del trabajo

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "fechaInicio": "2024-01-15",
    "fechaFin": "2024-01-21",
    "horariosDisponibles": {
      "Lunes": {
        "fecha": "2024-01-15",
        "horarios": [
          {
            "horaInicio": "08:00",
            "horaFin": "10:00",
            "disponible": true
          }
        ]
      }
    }
  }
}
```

### POST `/api/horarios/presupuesto/:presupuestoId/confirmar`
Confirma un horario seleccionado para un presupuesto.

**Body:**
```json
{
  "fecha": "2024-01-15",
  "horaInicio": "08:00",
  "horaFin": "10:00"
}
```

## Instalación y Configuración

### 1. Crear las Tablas en la Base de Datos
Ejecutar el script SQL proporcionado en la descripción del usuario para crear las tablas:
- `horario_profesional`
- `horario_dia` 
- `profesional_agenda`

### 2. Insertar Datos de Ejemplo
Ejecutar el script `scripts/insertar_horarios_ejemplo.sql` para insertar datos de prueba.

### 3. Reiniciar el Servidor
```bash
cd server
npm start
```

### 4. Reiniciar el Cliente
```bash
cd client
npm run dev
```

## Funcionalidades Implementadas

### ✅ Navegación entre Semanas
- Máximo 4 semanas (actual + 3 siguientes)
- No permite navegar a semanas pasadas
- Botones de navegación con estado deshabilitado

### ✅ Validación de Fechas
- No permite seleccionar días pasados
- No permite seleccionar horarios ocupados
- Validación en tiempo real de disponibilidad

### ✅ Interfaz de Usuario
- Calendario visual con días de la semana
- Horarios disponibles como botones clickeables
- Indicadores visuales para horarios seleccionados
- Diseño responsive para móviles

### ✅ Integración con Presupuestos
- Botón "Aceptar Presupuesto" abre el calendario
- Confirmación automática del horario
- Actualización del estado del presupuesto
- Notificación de éxito/error

### ✅ Gestión de Agenda
- Creación automática de entradas en agenda
- Verificación de conflictos de horarios
- Transacciones para mantener consistencia

## Uso del Sistema

1. **Cliente ve presupuestos**: En el dashboard, el cliente puede ver los presupuestos recibidos
2. **Abrir detalles**: Al hacer clic en "Ver Detalles" se abre el modal con información del presupuesto
3. **Aceptar presupuesto**: Al hacer clic en "Aceptar Presupuesto" se abre el calendario
4. **Seleccionar horario**: El cliente navega entre semanas y selecciona un horario disponible
5. **Confirmar**: Al confirmar, se crea la entrada en la agenda y se actualiza el estado del presupuesto

## Consideraciones Técnicas

- **Duración del trabajo**: Se usa el campo `duracion` del presupuesto para calcular slots de tiempo
- **Slots de 30 minutos**: Los horarios se dividen en slots de 30 minutos para mayor flexibilidad
- **Validación de conflictos**: Se verifica que no haya solapamiento con trabajos existentes
- **Transacciones**: Se usan transacciones SQL para mantener consistencia de datos
- **Responsive**: El calendario se adapta a diferentes tamaños de pantalla

## Próximas Mejoras Sugeridas

1. **Notificaciones**: Enviar notificaciones al profesional cuando se confirma un horario
2. **Recordatorios**: Sistema de recordatorios antes del trabajo
3. **Reagendamiento**: Permitir cambiar horarios ya confirmados
4. **Horarios especiales**: Manejar días festivos o horarios especiales
5. **Múltiples profesionales**: Soporte para trabajos que requieren múltiples profesionales


