-- Script para insertar datos de ejemplo en las tablas de horarios
-- Ejecutar este script después de crear las tablas horario_profesional y horario_dia

-- Insertar horario de ejemplo para un profesional (ID 1)
-- Horario vigente desde el 1 de enero de 2024
INSERT INTO horario_profesional (profesional_id, fechaInicio, fechaFin, notas) 
VALUES (1, '2024-01-01', NULL, 'Horario regular del profesional');

-- Obtener el ID del horario recién insertado
SET @horario_id = LAST_INSERT_ID();

-- Insertar horarios de lunes a viernes (8:00 a 17:00)
INSERT INTO horario_dia (horario_id, dia_semana, horaInicio, horaFin) VALUES
(@horario_id, 'Lunes', '08:00:00', '17:00:00'),
(@horario_id, 'Martes', '08:00:00', '17:00:00'),
(@horario_id, 'Miercoles', '08:00:00', '17:00:00'),
(@horario_id, 'Jueves', '08:00:00', '17:00:00'),
(@horario_id, 'Viernes', '08:00:00', '17:00:00');

-- Insertar horario de sábado (8:00 a 12:00)
INSERT INTO horario_dia (horario_id, dia_semana, horaInicio, horaFin) VALUES
(@horario_id, 'Sabado', '08:00:00', '12:00:00');

-- Insertar algunos trabajos ocupados en la agenda como ejemplo
-- Trabajo el lunes de 9:00 a 11:00
INSERT INTO profesional_agenda (profesional_id, solicitud_id, presupuesto_id, fecha, horaInicio, horaFin, estado) 
VALUES (1, 1, 1, CURDATE() + INTERVAL (1 - WEEKDAY(CURDATE())) DAY, '09:00:00', '11:00:00', 'confirmado');

-- Trabajo el miércoles de 14:00 a 16:00
INSERT INTO profesional_agenda (profesional_id, solicitud_id, presupuesto_id, fecha, horaInicio, horaFin, estado) 
VALUES (1, 2, 2, CURDATE() + INTERVAL (3 - WEEKDAY(CURDATE())) DAY, '14:00:00', '16:00:00', 'pendiente');

-- Si quieres insertar horarios para otro profesional (ID 2)
INSERT INTO horario_profesional (profesional_id, fechaInicio, fechaFin, notas) 
VALUES (2, '2024-01-01', NULL, 'Horario del segundo profesional');

SET @horario_id_2 = LAST_INSERT_ID();

-- Horario diferente: lunes a jueves 9:00-18:00, viernes 9:00-15:00
INSERT INTO horario_dia (horario_id, dia_semana, horaInicio, horaFin) VALUES
(@horario_id_2, 'Lunes', '09:00:00', '18:00:00'),
(@horario_id_2, 'Martes', '09:00:00', '18:00:00'),
(@horario_id_2, 'Miercoles', '09:00:00', '18:00:00'),
(@horario_id_2, 'Jueves', '09:00:00', '18:00:00'),
(@horario_id_2, 'Viernes', '09:00:00', '15:00:00');

-- Verificar los datos insertados
SELECT 
    hp.id as horario_id,
    hp.profesional_id,
    hp.fechaInicio,
    hp.fechaFin,
    hd.dia_semana,
    hd.horaInicio,
    hd.horaFin
FROM horario_profesional hp
LEFT JOIN horario_dia hd ON hp.id = hd.horario_id
ORDER BY hp.profesional_id, hd.dia_semana, hd.horaInicio;

-- Verificar agenda ocupada
SELECT 
    id,
    profesional_id,
    fecha,
    horaInicio,
    horaFin,
    estado
FROM profesional_agenda
ORDER BY fecha, horaInicio;


