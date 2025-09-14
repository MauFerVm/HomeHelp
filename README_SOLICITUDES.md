# Sistema de Solicitudes de Servicio - Home Help

## Descripción

Este sistema permite a los usuarios crear solicitudes de servicio a través de un formulario interactivo. Cuando se crea una solicitud, automáticamente se genera un historial de servicio con el estado inicial y se calcula la fecha de vencimiento basada en el tipo de estado.

## Características Implementadas

### Backend (Node.js + Express + MySQL)

#### Modelos Creados:
1. **EstadoSolServicio** (`estadoSolServicioModel.js`)
   - Maneja los estados de las solicitudes (abierta, notificada, en_progreso, cerrada, cancelada)
   - Calcula fechas de vencimiento automáticamente

2. **SolicitudServicio** (`solicitudServicioModel.js`)
   - Gestiona las solicitudes de servicio
   - Incluye validaciones y consultas optimizadas

3. **HistorialServicio** (`historialServicioModel.js`)
   - Registra el historial de cambios de estado
   - Mantiene trazabilidad completa de cada solicitud

#### Controlador:
- **solicitudController.js**: Maneja la lógica de negocio y transacciones

#### Rutas:
- **solicitudRoutes.js**: Endpoints REST para el manejo de solicitudes

### Frontend (React)

#### Componente:
- **PublicarProblemaForm.jsx**: Formulario modal para crear solicitudes
- **PublicarProblemaForm.css**: Estilos responsivos del formulario

## Funcionalidades del Formulario

### Campos del Formulario:
1. **Tipo de Trabajo**: Dropdown que se carga dinámicamente desde la BD
2. **Prioridad**: Selección entre baja, media, alta
3. **Título**: Campo de texto obligatorio (mínimo 5 caracteres)
4. **Descripción**: Textarea obligatorio (mínimo 10 caracteres)
5. **Dirección**: Campo de texto obligatorio
6. **Localidad**: Dropdown (pendiente de implementar carga dinámica)
7. **Foto**: Subida de archivo opcional (máximo 5MB, solo imágenes)

### Validaciones:
- Validación de campos obligatorios
- Validación de longitud mínima en título y descripción
- Validación de tipo y tamaño de archivo
- Validación de formato de imagen

## Transacción de Base de Datos

Cuando se crea una solicitud, se ejecuta una transacción que:

1. **Crea la solicitud** en la tabla `solicitud_servicio`
2. **Obtiene el estado inicial** ("abierta" por defecto)
3. **Calcula la fecha de vencimiento** basada en `vencimiento_dias` del estado
4. **Crea el primer registro** en `historial_servicio`
5. **Confirma la transacción** o la revierte en caso de error

## Endpoints de la API

### GET `/api/solicitudes/tipos-trabajo`
Obtiene los tipos de trabajo activos para el dropdown.

### GET `/api/solicitudes/estados`
Obtiene los estados de solicitud disponibles.

### POST `/api/solicitudes`
Crea una nueva solicitud de servicio con su historial inicial.
- **Content-Type**: `multipart/form-data` (para subir archivos)
- **Body**: FormData con todos los campos del formulario

### GET `/api/solicitudes/cliente/:clienteId`
Obtiene todas las solicitudes de un cliente específico.

### GET `/api/solicitudes/:id`
Obtiene una solicitud específica con su historial completo.

### GET `/api/solicitudes`
Obtiene todas las solicitudes (para administradores).

## Configuración de Archivos

### Subida de Archivos:
- **Directorio**: `server/public/uploads/solicitudes/`
- **Límite de tamaño**: 5MB
- **Tipos permitidos**: Solo imágenes (JPG, PNG, GIF)
- **Nomenclatura**: `solicitud-{timestamp}-{random}.{ext}`

## Integración con el Dashboard

El formulario se integra con el dashboard existente:
- Se abre como modal al hacer clic en "Publicar un problema"
- Mantiene el diseño consistente con el resto de la aplicación
- Es completamente responsivo

## Base de Datos

El sistema utiliza las tablas definidas en `ActualizacionHomeDB.sql`:
- `estado_sol_servicio`: Estados y días de vencimiento
- `solicitud_servicio`: Solicitudes principales
- `historial_servicio`: Historial de cambios
- `tipo_profesional`: Tipos de trabajo disponibles

## Próximos Pasos Sugeridos

1. **Implementar carga dinámica de localidades** desde la API
2. **Agregar autenticación** para obtener el ID del cliente logueado
3. **Implementar notificaciones** cuando se crea una solicitud
4. **Agregar validación de permisos** según el rol del usuario
5. **Implementar vista de solicitudes** para que los usuarios vean sus solicitudes creadas

## Uso

1. **Iniciar el servidor**: `npm run dev` en la carpeta `server/`
2. **Iniciar el cliente**: `npm run dev` en la carpeta `client/`
3. **Acceder al dashboard** y hacer clic en "Publicar un problema"
4. **Completar el formulario** y enviar la solicitud

## Estructura de Archivos

```
HomeHelp2/
├── server/
│   ├── models/
│   │   ├── estadoSolServicioModel.js
│   │   ├── solicitudServicioModel.js
│   │   └── historialServicioModel.js
│   ├── controllers/
│   │   └── solicitudController.js
│   ├── routes/
│   │   └── solicitudRoutes.js
│   └── public/uploads/solicitudes/
└── client/
    └── src/
        └── components/
            ├── PublicarProblemaForm.jsx
            └── PublicarProblemaForm.css
```

## Notas Técnicas

- **Transacciones**: Se utilizan transacciones de MySQL para garantizar consistencia
- **Validación**: Validación tanto en frontend como backend
- **Archivos**: Manejo seguro de subida de archivos con multer
- **Responsive**: Diseño completamente responsivo
- **Error Handling**: Manejo robusto de errores en todas las capas
