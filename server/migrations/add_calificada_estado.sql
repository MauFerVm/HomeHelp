-- Agregar estado 'calificada' a orden_de_trabajo
ALTER TABLE `orden_de_trabajo`
MODIFY `estado` enum(
    'pendiente',
    'represupuestada',
    'en_curso',
    'completado',
    'cancelado',
    'reprogramado',
    'cerradoprofesional',
    'cerradocliente',
    'calificada'
) NOT NULL DEFAULT 'pendiente';
