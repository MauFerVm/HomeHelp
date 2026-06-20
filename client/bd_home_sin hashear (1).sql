-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-05-2026 a las 21:30:12
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd_home_help1`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones`
--

CREATE TABLE `calificaciones` (
  `id` int(11) NOT NULL,
  `solicitud_id` int(11) NOT NULL,
  `calificador_persona_id` int(11) NOT NULL,
  `calificado_persona_id` int(11) NOT NULL,
  `puntuacion` tinyint(4) NOT NULL CHECK (`puntuacion` between 1 and 5),
  `comentario` text DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calificaciones`
--

INSERT INTO `calificaciones` (`id`, `solicitud_id`, `calificador_persona_id`, `calificado_persona_id`, `puntuacion`, `comentario`, `creado_en`, `activo`) VALUES
(1, 12, 1, 5, 3, 'No responder', '2025-11-06 21:16:51', 1),
(2, 14, 9, 1, 3, 'Testeo calificacion', '2025-11-06 21:36:17', 1),
(3, 14, 1, 9, 4, 'Prueba cliente', '2025-11-06 21:37:55', 1),
(4, 17, 1, 9, 1, 'Puto', '2025-11-09 18:13:29', 1),
(5, 16, 9, 1, 5, NULL, '2025-11-09 18:18:46', 1),
(6, 16, 1, 9, 2, NULL, '2025-11-09 18:19:03', 1),
(7, 18, 9, 1, 3, 'testeoformulario', '2025-11-09 18:22:54', 1),
(8, 18, 1, 9, 1, NULL, '2025-11-09 18:28:55', 1),
(9, 19, 9, 1, 1, NULL, '2025-11-09 18:38:07', 1),
(10, 19, 1, 9, 1, NULL, '2025-11-09 18:45:43', 1),
(11, 21, 5, 1, 1, NULL, '2025-11-09 18:51:13', 1),
(12, 21, 1, 5, 3, NULL, '2025-11-09 18:51:56', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente_hogar`
--

CREATE TABLE `cliente_hogar` (
  `id` int(11) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `localidad_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `cliente_hogar`
--

INSERT INTO `cliente_hogar` (`id`, `direccion`, `localidad_id`) VALUES
(1, 'Vicente Lopez y Planes 545', 1),
(6, 'Villa Urquiza 66', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_sol_servicio`
--

CREATE TABLE `estado_sol_servicio` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `vencimiento_dias` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `estado_sol_servicio`
--

INSERT INTO `estado_sol_servicio` (`id`, `nombre`, `vencimiento_dias`) VALUES
(1, 'abierta', 30),
(2, 'notificada', 7),
(3, 'en_progreso', 0),
(4, 'cerrada', 0),
(5, 'cancelada', 0),
(6, 'presupuesto aceptado', 15);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_servicio`
--

CREATE TABLE `historial_servicio` (
  `id` int(11) NOT NULL,
  `solicitud_id` int(11) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_vencimiento` datetime DEFAULT NULL,
  `estado_id` int(11) NOT NULL,
  `notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `historial_servicio`
--

INSERT INTO `historial_servicio` (`id`, `solicitud_id`, `fecha_creacion`, `fecha_vencimiento`, `estado_id`, `notas`) VALUES
(1, 1, '2025-09-14 16:00:16', '2025-10-14 16:00:16', 1, 'Solicitud creada'),
(2, 2, '2025-09-14 16:16:04', '2025-10-14 16:16:04', 1, 'Solicitud creada'),
(3, 3, '2025-09-14 16:38:11', '2025-10-14 16:38:11', 1, 'Solicitud creada'),
(4, 4, '2025-09-14 16:42:01', '2025-10-14 16:42:01', 1, 'Solicitud creada'),
(5, 5, '2025-09-18 19:16:32', '2025-10-18 19:16:32', 1, 'Solicitud creada'),
(6, 6, '2025-09-20 15:53:08', '2025-10-20 15:53:08', 1, 'Solicitud creada'),
(7, 7, '2025-09-20 16:17:53', '2025-10-20 16:17:53', 1, 'Solicitud creada'),
(8, 8, '2025-09-22 15:06:35', '2025-10-22 15:06:35', 1, 'Solicitud creada'),
(9, 9, '2025-10-25 16:04:10', '2025-11-24 16:04:10', 1, 'Solicitud creada'),
(10, 9, '2025-10-25 16:57:54', NULL, 3, 'Presupuesto aceptado - Orden de trabajo creada'),
(11, 10, '2025-10-25 17:04:27', '2025-11-24 17:04:27', 1, 'Solicitud creada'),
(12, 10, '2025-10-25 17:05:51', '2025-11-09 17:05:51', 6, 'Presupuesto aceptado'),
(13, 11, '2025-10-25 17:15:51', '2025-11-24 17:15:51', 1, 'Solicitud creada'),
(21, 11, '2025-10-25 17:40:37', '2025-11-09 17:40:37', 6, 'Presupuesto aceptado'),
(22, 12, '2025-11-06 19:20:01', '2025-12-06 19:20:01', 1, 'Solicitud creada'),
(23, 12, '2025-11-06 19:21:37', '2025-11-21 19:21:37', 6, 'Presupuesto aceptado'),
(24, 13, '2025-11-06 19:59:03', '2025-12-06 19:59:03', 1, 'Solicitud creada'),
(25, 13, '2025-11-06 20:06:20', '2025-11-21 20:06:20', 6, 'Presupuesto aceptado'),
(26, 10, '2025-11-06 20:30:43', NULL, 4, 'Orden de trabajo completada'),
(27, 14, '2025-11-06 20:37:25', '2025-12-06 20:37:25', 1, 'Solicitud creada'),
(28, 15, '2025-11-06 20:55:49', '2025-12-06 20:55:49', 1, 'Solicitud creada'),
(29, 14, '2025-11-06 20:57:02', '2025-11-21 20:57:02', 6, 'Presupuesto aceptado'),
(30, 14, '2025-11-06 21:35:50', NULL, 4, 'Orden de trabajo completada'),
(31, 16, '2025-11-09 17:42:54', '2025-12-09 17:42:54', 1, 'Solicitud creada'),
(32, 16, '2025-11-09 17:48:05', '2025-11-24 17:48:05', 6, 'Presupuesto aceptado'),
(33, 17, '2025-11-09 17:54:59', '2025-12-09 17:54:59', 1, 'Solicitud creada'),
(34, 17, '2025-11-09 17:55:53', '2025-11-24 17:55:53', 6, 'Presupuesto aceptado'),
(35, 17, '2025-11-09 18:13:19', NULL, 4, 'Orden de trabajo completada'),
(36, 16, '2025-11-09 18:18:43', NULL, 4, 'Orden de trabajo completada'),
(37, 18, '2025-11-09 18:19:56', '2025-12-09 18:19:56', 1, 'Solicitud creada'),
(38, 18, '2025-11-09 18:21:24', '2025-11-24 18:21:24', 6, 'Presupuesto aceptado'),
(39, 18, '2025-11-09 18:22:40', NULL, 4, 'Orden de trabajo completada'),
(40, 12, '2025-11-09 18:35:52', NULL, 4, 'Orden de trabajo completada'),
(41, 19, '2025-11-09 18:36:44', '2025-12-09 18:36:44', 1, 'Solicitud creada'),
(42, 19, '2025-11-09 18:37:34', '2025-11-24 18:37:34', 6, 'Presupuesto aceptado'),
(43, 19, '2025-11-09 18:38:04', NULL, 4, 'Orden de trabajo completada'),
(44, 20, '2025-11-09 18:46:29', '2025-12-09 18:46:29', 1, 'Solicitud creada'),
(45, 21, '2025-11-09 18:46:40', '2025-12-09 18:46:40', 1, 'Solicitud creada'),
(46, 22, '2025-11-09 18:46:53', '2025-12-09 18:46:53', 1, 'Solicitud creada'),
(47, 20, '2025-11-09 18:48:05', '2025-11-24 18:48:05', 6, 'Presupuesto aceptado'),
(48, 21, '2025-11-09 18:48:14', '2025-11-24 18:48:14', 6, 'Presupuesto aceptado'),
(49, 22, '2025-11-09 18:48:35', '2025-11-24 18:48:35', 6, 'Presupuesto aceptado'),
(50, 20, '2025-11-09 18:49:49', NULL, 4, 'Orden de trabajo completada'),
(51, 21, '2025-11-09 18:50:56', NULL, 4, 'Orden de trabajo completada'),
(52, 23, '2025-11-09 20:05:26', '2025-12-09 20:05:26', 1, 'Solicitud creada'),
(53, 24, '2025-11-09 20:05:45', '2025-12-09 20:05:45', 1, 'Solicitud creada'),
(54, 23, '2025-11-09 20:21:06', '2025-11-24 20:21:06', 6, 'Presupuesto aceptado'),
(55, 24, '2025-11-09 20:22:55', '2025-11-24 20:22:55', 6, 'Presupuesto aceptado'),
(56, 25, '2026-05-30 16:24:12', '2026-06-29 16:24:12', 1, 'Solicitud creada'),
(57, 26, '2026-05-30 16:24:19', '2026-06-29 16:24:19', 1, 'Solicitud creada'),
(58, 27, '2026-05-30 16:24:40', '2026-06-29 16:24:40', 1, 'Solicitud creada'),
(59, 28, '2026-05-30 16:24:53', '2026-06-29 16:24:53', 1, 'Solicitud creada'),
(60, 29, '2026-05-30 16:25:03', '2026-06-29 16:25:03', 1, 'Solicitud creada'),
(61, 30, '2026-05-30 16:25:09', '2026-06-29 16:25:09', 1, 'Solicitud creada'),
(62, 31, '2026-05-30 16:25:13', '2026-06-29 16:25:13', 1, 'Solicitud creada'),
(63, 32, '2026-05-30 16:26:19', '2026-06-29 16:26:19', 1, 'Solicitud creada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario_dia`
--

CREATE TABLE `horario_dia` (
  `id` int(11) NOT NULL,
  `horario_id` int(11) NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horario_dia`
--

INSERT INTO `horario_dia` (`id`, `horario_id`, `dia_semana`, `horaInicio`, `horaFin`) VALUES
(1, 1, 'Lunes', '08:00:00', '13:00:00'),
(2, 1, 'Jueves', '13:00:00', '20:00:00'),
(3, 2, 'Viernes', '08:00:00', '14:00:00'),
(4, 1, 'Sabado', '08:00:00', '12:00:00'),
(5, 3, 'Sabado', '12:30:00', '23:20:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario_profesional`
--

CREATE TABLE `horario_profesional` (
  `id` int(11) NOT NULL,
  `profesional_id` int(11) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `horario_profesional`
--

INSERT INTO `horario_profesional` (`id`, `profesional_id`, `fechaInicio`, `fechaFin`, `creado_en`, `notas`) VALUES
(1, 5, '2025-10-01', '2025-10-31', '2025-10-20 12:31:40', NULL),
(2, 5, '2025-11-01', NULL, '2025-10-20 13:44:44', NULL),
(3, 9, '2025-11-06', NULL, '2025-11-06 20:02:15', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `localidad`
--

CREATE TABLE `localidad` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `provincia_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `localidad`
--

INSERT INTO `localidad` (`id`, `nombre`, `provincia_id`) VALUES
(1, 'La Plata', 1),
(2, 'Bahía Blanca', 1),
(3, 'Córdoba Capital', 2),
(4, 'Villa Carlos Paz', 2),
(5, 'Rosario', 3),
(6, 'Santa Fe', 3),
(7, 'Mendoza', 4),
(8, 'San Rafael', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_notificacion` enum('solicitud','pago','oferta','sistema') NOT NULL,
  `referencia_id` int(11) NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificacion`
--

INSERT INTO `notificacion` (`id`, `usuario_id`, `tipo_notificacion`, `referencia_id`, `mensaje`, `leido`, `creado_en`) VALUES
(1, 6, 'solicitud', 7, 'Gaston Cons creó una nueva solicitud de servicio que podría interesarte.', 0, '2025-09-20 16:17:53'),
(2, 6, 'solicitud', 8, 'Primer Cliente creó una nueva solicitud de servicio que podría interesarte.', 0, '2025-09-22 15:06:35'),
(3, 6, 'solicitud', 9, 'Primer Cliente creó una nueva solicitud de servicio: Mesa 4 patas', 0, '2025-10-25 16:04:10'),
(4, 9, 'solicitud', 9, 'Primer Cliente creó una nueva solicitud de servicio: Mesa 4 patas', 0, '2025-10-25 16:04:10'),
(5, 6, 'solicitud', 10, 'Primer Cliente creó una nueva solicitud de servicio: Mauri es gei', 0, '2025-10-25 17:04:27'),
(6, 9, 'solicitud', 10, 'Primer Cliente creó una nueva solicitud de servicio: Mauri es gei', 0, '2025-10-25 17:04:27'),
(7, 6, 'solicitud', 11, 'Primer Cliente creó una nueva solicitud de servicio: Ahora mauri come hombres', 0, '2025-10-25 17:15:51'),
(8, 9, 'solicitud', 11, 'Primer Cliente creó una nueva solicitud de servicio: Ahora mauri come hombres', 0, '2025-10-25 17:15:51'),
(16, 6, 'solicitud', 11, 'Primer Cliente aceptó tu presupuesto: Ahora mauri come hombres', 0, '2025-10-25 17:40:37'),
(17, 6, 'solicitud', 12, 'Primer Cliente creó una nueva solicitud de servicio: Ahora mauri come 4 hombres', 0, '2025-11-06 19:20:01'),
(18, 9, 'solicitud', 12, 'Primer Cliente creó una nueva solicitud de servicio: Ahora mauri come 4 hombres', 0, '2025-11-06 19:20:01'),
(19, 6, 'solicitud', 12, 'Primer Cliente aceptó tu presupuesto: Ahora mauri come 4 hombres', 0, '2025-11-06 19:21:37'),
(20, 10, 'solicitud', 13, 'Primer Cliente creó una nueva solicitud de servicio: Mauri se le cruzan los cables', 0, '2025-11-06 19:59:03'),
(21, 10, 'solicitud', 13, 'Primer Cliente aceptó tu presupuesto: Mauri se le cruzan los cables', 0, '2025-11-06 20:06:20'),
(22, 10, 'solicitud', 14, 'Primer Cliente creó una nueva solicitud de servicio: Mauri trafica merca en la costa', 0, '2025-11-06 20:37:25'),
(23, 10, 'solicitud', 15, 'Primer Cliente creó una nueva solicitud de servicio: pruebahorario', 0, '2025-11-06 20:55:49'),
(24, 10, 'solicitud', 14, 'Primer Cliente aceptó tu presupuesto: Mauri trafica merca en la costa', 0, '2025-11-06 20:57:02'),
(25, 10, 'solicitud', 16, 'Primer Cliente creó una nueva solicitud de servicio: pruebaformularios', 0, '2025-11-09 17:42:54'),
(26, 10, 'solicitud', 16, 'Primer Cliente aceptó tu presupuesto: pruebaformularios', 0, '2025-11-09 17:48:05'),
(27, 10, 'solicitud', 17, 'Primer Cliente creó una nueva solicitud de servicio: prueba de formulario horarios', 0, '2025-11-09 17:54:59'),
(28, 10, 'solicitud', 17, 'Primer Cliente aceptó tu presupuesto: prueba de formulario horarios', 0, '2025-11-09 17:55:53'),
(29, 10, 'solicitud', 18, 'Primer Cliente creó una nueva solicitud de servicio: testeoformularios', 0, '2025-11-09 18:19:56'),
(30, 10, 'solicitud', 18, 'Primer Cliente aceptó tu presupuesto: testeoformularios', 0, '2025-11-09 18:21:24'),
(31, 10, 'solicitud', 19, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion', 0, '2025-11-09 18:36:44'),
(32, 10, 'solicitud', 19, 'Primer Cliente aceptó tu presupuesto: testeocalificacion', 0, '2025-11-09 18:37:34'),
(33, 6, 'solicitud', 20, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion1', 0, '2025-11-09 18:46:29'),
(34, 9, 'solicitud', 20, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion1', 0, '2025-11-09 18:46:29'),
(35, 6, 'solicitud', 21, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion2', 0, '2025-11-09 18:46:40'),
(36, 9, 'solicitud', 21, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion2', 0, '2025-11-09 18:46:40'),
(37, 6, 'solicitud', 22, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion3', 0, '2025-11-09 18:46:53'),
(38, 9, 'solicitud', 22, 'Primer Cliente creó una nueva solicitud de servicio: testeocalificacion3', 0, '2025-11-09 18:46:53'),
(39, 6, 'solicitud', 20, 'Primer Cliente aceptó tu presupuesto: testeocalificacion1', 0, '2025-11-09 18:48:05'),
(40, 6, 'solicitud', 21, 'Primer Cliente aceptó tu presupuesto: testeocalificacion2', 0, '2025-11-09 18:48:14'),
(41, 6, 'solicitud', 22, 'Primer Cliente aceptó tu presupuesto: testeocalificacion3', 0, '2025-11-09 18:48:35'),
(42, 10, 'solicitud', 23, 'Primer Cliente creó una nueva solicitud de servicio: Testeohorarios1', 0, '2025-11-09 20:05:26'),
(43, 10, 'solicitud', 24, 'Primer Cliente creó una nueva solicitud de servicio: Testeohorarios2', 0, '2025-11-09 20:05:45'),
(44, 10, 'solicitud', 23, 'Primer Cliente aceptó tu presupuesto: Testeohorarios1', 0, '2025-11-09 20:21:06'),
(45, 10, 'solicitud', 24, 'Primer Cliente aceptó tu presupuesto: Testeohorarios2', 0, '2025-11-09 20:22:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orden_de_trabajo`
--

CREATE TABLE `orden_de_trabajo` (
  `id` int(11) NOT NULL,
  `presupuesto_id` int(11) DEFAULT NULL,
  `solicitud_id` int(11) NOT NULL,
  `profesional_id` int(11) NOT NULL,
  `cliente_persona_id` int(11) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_programada` date DEFAULT NULL,
  `horarioInicio` time DEFAULT NULL,
  `horaFin` time DEFAULT NULL,
  `estado` enum('pendiente','represupuestada','en_curso','completado','cancelado','reprogramado','cerradoprofesional','cerradocliente') NOT NULL DEFAULT 'pendiente',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `previous_orden_id` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `orden_de_trabajo`
--

INSERT INTO `orden_de_trabajo` (`id`, `presupuesto_id`, `solicitud_id`, `profesional_id`, `cliente_persona_id`, `monto`, `descripcion`, `fecha_programada`, `horarioInicio`, `horaFin`, `estado`, `is_active`, `previous_orden_id`, `creado_en`) VALUES
(2, 6, 9, 5, 1, 123232.00, 'No responder a esto', '2025-10-30', '17:00:00', '20:00:00', 'cerradoprofesional', 1, NULL, '2025-10-25 16:57:54'),
(3, 7, 10, 5, 1, 120000.00, '120 para que mauri se cure de gei', '2025-10-27', '08:00:00', '09:30:00', 'completado', 1, NULL, '2025-10-25 17:05:51'),
(11, 8, 11, 5, 1, 19000.00, 'mauri come hombres', '2025-11-07', '08:00:00', '10:34:00', 'completado', 1, NULL, '2025-10-25 17:40:37'),
(12, 9, 12, 5, 1, 1000.00, 'Mauri tiene gei ayuda xd', '2025-11-07', '12:00:00', '13:30:00', 'completado', 1, NULL, '2025-11-06 19:21:37'),
(13, 10, 13, 9, 1, 2000.00, '2000 MIL cada traba', '2025-11-08', '14:30:00', '18:30:00', 'completado', 1, NULL, '2025-11-06 20:06:20'),
(14, 11, 14, 9, 1, 10000.00, 'No responder a esto si trafico xd', '2025-11-15', '13:30:00', '17:00:00', 'completado', 1, NULL, '2025-11-06 20:57:02'),
(15, 13, 16, 9, 1, 10000.00, 'No responder a esto', '2025-11-15', '19:00:00', '22:30:00', 'completado', 1, NULL, '2025-11-09 17:48:05'),
(16, 14, 17, 9, 1, 10000.00, 'kljljkkljlkjkljkljkl', '2025-11-22', '12:30:00', '14:00:00', 'completado', 1, NULL, '2025-11-09 17:55:53'),
(17, 15, 18, 9, 1, 94000.00, 'no responder', '2025-11-29', '14:00:00', '17:00:00', 'completado', 1, NULL, '2025-11-09 18:21:24'),
(18, 16, 19, 9, 1, 13000.00, 'No responder', '2025-11-29', '18:00:00', '22:00:00', 'completado', 1, NULL, '2025-11-09 18:37:34'),
(19, 18, 20, 5, 1, 1200.00, 'gfdgfgfdg', '2025-11-14', '08:30:00', '10:30:00', 'completado', 1, NULL, '2025-11-09 18:48:05'),
(20, 17, 21, 5, 1, 1200.00, 'dsdfsdfsdfs', '2025-11-14', '11:30:00', '12:30:00', 'completado', 1, NULL, '2025-11-09 18:48:14'),
(21, 19, 22, 5, 1, 12000.00, 'fgdggf', '2025-11-21', '10:00:00', '12:00:00', 'pendiente', 1, NULL, '2025-11-09 18:48:35'),
(22, 20, 23, 9, 1, 29999.00, 'fdsdfs', '2025-11-22', '15:00:00', '16:00:00', 'pendiente', 1, NULL, '2025-11-09 20:21:06'),
(23, 21, 24, 9, 1, 1330.00, 'testeoo', '2025-11-22', '17:30:00', '19:30:00', 'pendiente', 1, NULL, '2025-11-09 20:22:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id` int(11) NOT NULL,
  `nombre_apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `persona`
--

INSERT INTO `persona` (`id`, `nombre_apellido`, `fecha_nacimiento`, `foto_perfil`, `usuario_id`) VALUES
(1, 'Primer Cliente', '2002-01-19', NULL, 1),
(3, 'profesionaltest', '2000-01-10', NULL, 4),
(4, 'pruebatesteo', '2000-01-01', 'foto_perfil-1757878555582-604596296.jpg', 5),
(5, 'Javo Menem', '1995-11-10', 'foto_perfil-1758564158840-655224206.jpg', 6),
(6, 'Gaston Cons', '1995-12-12', 'foto_perfil-1758564158840-439601206.jpg', 7),
(7, 'Bruno', '1996-12-01', 'foto_perfil-1760644705788-53963336.png', 8),
(8, 'Gabriel B', '2001-03-12', NULL, 9),
(9, 'electri', '2000-02-01', NULL, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuesto`
--

CREATE TABLE `presupuesto` (
  `id` int(11) NOT NULL,
  `solicitud_id` int(11) NOT NULL,
  `profesional_persona_id` int(11) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('enviado','aceptado','rechazado') NOT NULL DEFAULT 'enviado',
  `duracion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `presupuesto`
--

INSERT INTO `presupuesto` (`id`, `solicitud_id`, `profesional_persona_id`, `monto`, `descripcion`, `creado_en`, `estado`, `duracion`) VALUES
(1, 2, 3, 150000.00, 'Precio del metro cuadrado 8000', '2025-10-13 00:22:28', 'enviado', 0),
(2, 7, 5, 60000.00, 'El presupuesto es por una puerta mediana, sin molduras y con una ventana doble', '2025-10-16 14:41:04', 'enviado', 0),
(3, 8, 5, 65000.00, 'Puerta con ventanas grandes, para que entre mucha luz lugar para cerradura y traba.', '2025-10-16 16:04:24', 'aceptado', 180),
(4, 3, 7, 120000.00, 'Mesa redonda con 4 patas, como la pongo a tu jermu', '2025-10-16 16:59:43', 'enviado', 0),
(5, 8, 8, 350000.00, 'Puerta de primera calidad con terminaciones en relieve y instlacion', '2025-10-16 21:24:42', 'enviado', 0),
(6, 9, 5, 123232.00, 'No responder a esto', '2025-10-25 16:04:54', 'aceptado', 180),
(7, 10, 5, 120000.00, '120 para que mauri se cure de gei', '2025-10-25 17:05:23', 'aceptado', 90),
(8, 11, 5, 19000.00, 'mauri come hombres', '2025-10-25 17:16:16', 'aceptado', 154),
(9, 12, 5, 1000.00, 'Mauri tiene gei ayuda xd', '2025-11-06 19:21:02', 'aceptado', 90),
(10, 13, 9, 2000.00, '2000 MIL cada traba', '2025-11-06 20:00:09', 'aceptado', 240),
(11, 14, 9, 10000.00, 'No responder a esto si trafico xd', '2025-11-06 20:38:01', 'aceptado', 210),
(12, 15, 9, 120000.00, 'test', '2025-11-06 20:56:10', 'enviado', 150),
(13, 16, 9, 10000.00, 'No responder a esto', '2025-11-09 17:46:56', 'aceptado', 210),
(14, 17, 9, 10000.00, 'kljljkkljlkjkljkljkl', '2025-11-09 17:55:32', 'aceptado', 90),
(15, 18, 9, 94000.00, 'no responder', '2025-11-09 18:20:42', 'aceptado', 180),
(16, 19, 9, 13000.00, 'No responder', '2025-11-09 18:37:13', 'aceptado', 240),
(17, 21, 5, 1200.00, 'dsdfsdfsdfs', '2025-11-09 18:47:23', 'aceptado', 60),
(18, 20, 5, 1200.00, 'gfdgfgfdg', '2025-11-09 18:47:37', 'aceptado', 120),
(19, 22, 5, 12000.00, 'fgdggf', '2025-11-09 18:47:50', 'aceptado', 120),
(20, 23, 9, 29999.00, 'fdsdfs', '2025-11-09 20:06:23', 'aceptado', 60),
(21, 24, 9, 1330.00, 'testeoo', '2025-11-09 20:06:43', 'aceptado', 120);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesional`
--

CREATE TABLE `profesional` (
  `id` int(11) NOT NULL,
  `presentacion` text DEFAULT NULL,
  `instituto` varchar(100) DEFAULT NULL,
  `foto_titulo` varchar(255) DEFAULT NULL,
  `localidad_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `profesional`
--

INSERT INTO `profesional` (`id`, `presentacion`, `instituto`, `foto_titulo`, `localidad_id`) VALUES
(3, 'Esta es una prueba no respondesr', NULL, NULL, 2),
(4, 'No responder a esto', NULL, NULL, 5),
(5, 'Queres que te serruche como ninguno?', NULL, NULL, 1),
(7, 'dame trabajo o abstente a las consecuencias', NULL, NULL, 3),
(8, 'La calidad ante todo', NULL, NULL, 1),
(9, 'no contestar', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesional_agenda`
--

CREATE TABLE `profesional_agenda` (
  `id` int(11) NOT NULL,
  `profesional_id` int(11) NOT NULL,
  `solicitud_id` int(11) DEFAULT NULL,
  `presupuesto_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `horaInicio` time NOT NULL,
  `horaFin` time NOT NULL,
  `estado` enum('pendiente','confirmado','en_curso','completado','cancelado') NOT NULL DEFAULT 'pendiente',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `profesional_agenda`
--

INSERT INTO `profesional_agenda` (`id`, `profesional_id`, `solicitud_id`, `presupuesto_id`, `fecha`, `horaInicio`, `horaFin`, `estado`, `creado_en`, `actualizado_en`) VALUES
(1, 5, 8, 3, '2025-10-30', '13:00:00', '16:00:00', 'pendiente', '2025-10-25 16:42:08', '2025-10-25 16:42:08'),
(2, 5, 9, 6, '2025-10-30', '17:00:00', '20:00:00', 'pendiente', '2025-10-25 16:57:54', '2025-10-25 16:57:54'),
(3, 5, 10, 7, '2025-10-27', '08:00:00', '09:30:00', 'pendiente', '2025-10-25 17:05:51', '2025-10-25 17:05:51'),
(11, 5, 11, 8, '2025-11-07', '08:00:00', '10:34:00', 'pendiente', '2025-10-25 17:40:37', '2025-10-25 17:40:37'),
(12, 5, 12, 9, '2025-11-07', '12:00:00', '13:30:00', 'pendiente', '2025-11-06 19:21:37', '2025-11-06 19:21:37'),
(13, 9, 13, 10, '2025-11-08', '14:30:00', '18:30:00', 'pendiente', '2025-11-06 20:06:20', '2025-11-06 20:06:20'),
(14, 9, 14, 11, '2025-11-15', '13:30:00', '17:00:00', 'pendiente', '2025-11-06 20:57:02', '2025-11-06 20:57:02'),
(15, 9, 16, 13, '2025-11-15', '19:00:00', '22:30:00', 'pendiente', '2025-11-09 17:48:05', '2025-11-09 17:48:05'),
(16, 9, 17, 14, '2025-11-22', '12:30:00', '14:00:00', 'pendiente', '2025-11-09 17:55:53', '2025-11-09 17:55:53'),
(17, 9, 18, 15, '2025-11-29', '14:00:00', '17:00:00', 'pendiente', '2025-11-09 18:21:24', '2025-11-09 18:21:24'),
(18, 9, 19, 16, '2025-11-29', '18:00:00', '22:00:00', 'pendiente', '2025-11-09 18:37:34', '2025-11-09 18:37:34'),
(19, 5, 20, 18, '2025-11-14', '08:30:00', '10:30:00', 'pendiente', '2025-11-09 18:48:05', '2025-11-09 18:48:05'),
(20, 5, 21, 17, '2025-11-14', '11:30:00', '12:30:00', 'pendiente', '2025-11-09 18:48:14', '2025-11-09 18:48:14'),
(21, 5, 22, 19, '2025-11-21', '10:00:00', '12:00:00', 'pendiente', '2025-11-09 18:48:35', '2025-11-09 18:48:35'),
(22, 9, 23, 20, '2025-11-22', '15:00:00', '16:00:00', 'pendiente', '2025-11-09 20:21:06', '2025-11-09 20:21:06'),
(23, 9, 24, 21, '2025-11-22', '17:30:00', '19:30:00', 'pendiente', '2025-11-09 20:22:54', '2025-11-09 20:22:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesional_tipo`
--

CREATE TABLE `profesional_tipo` (
  `profesional_id` int(11) NOT NULL,
  `tipo_profesional_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `profesional_tipo`
--

INSERT INTO `profesional_tipo` (`profesional_id`, `tipo_profesional_id`) VALUES
(3, 7),
(4, 6),
(5, 4),
(7, 4),
(8, 4),
(9, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `provincia`
--

CREATE TABLE `provincia` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `provincia`
--

INSERT INTO `provincia` (`id`, `nombre`) VALUES
(1, 'Buenos Aires'),
(2, 'Córdoba'),
(3, 'Santa Fe'),
(4, 'Mendoza');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesion`
--

CREATE TABLE `sesion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `iniciada` datetime NOT NULL DEFAULT current_timestamp(),
  `finalizada` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_servicio`
--

CREATE TABLE `solicitud_servicio` (
  `id` int(11) NOT NULL,
  `cliente_persona_id` int(11) NOT NULL,
  `tipo_profesional_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `localidad_id` int(11) NOT NULL,
  `estado_id` int(11) NOT NULL,
  `prioridad` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `foto` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `solicitud_servicio`
--

INSERT INTO `solicitud_servicio` (`id`, `cliente_persona_id`, `tipo_profesional_id`, `titulo`, `descripcion`, `direccion`, `localidad_id`, `estado_id`, `prioridad`, `foto`, `creado_en`) VALUES
(1, 1, 3, 'Fuga de agua en el baño', 'Tengo una perdida en el baño', 'Vicente Lopez y Planes 545', 2, 1, 'alta', '/uploads/solicitudes/solicitud-1757876416186-554358659.jpg', '2025-09-14 16:00:16'),
(2, 1, 7, 'Necesito hacer una obra pequeña', 'Este es una prueba', 'Las heras 2655', 2, 1, 'baja', '/uploads/solicitudes/solicitud-1757877364348-2777399.jpg', '2025-09-14 16:16:04'),
(3, 1, 4, 'Necesito hacer una mesa', 'La mesa es cuadrada y tiene 4 patas', 'Las heras 2655', 3, 1, 'media', '/uploads/solicitudes/solicitud-1757878691402-482541476.jpg', '2025-09-14 16:38:11'),
(4, 6, 1, 'Tengo una perdida de electricidad', 'No responder a esto es una prueba', 'Las heras 2655', 3, 1, 'baja', '/uploads/solicitudes/solicitud-1757878921032-947509298.jpg', '2025-09-14 16:42:01'),
(5, 1, 7, 'Fuga', 'Tengo una perdida de agua en la bacha de la cocina', 'Vicente Lopez y Planes 545', 1, 1, 'baja', '/uploads/solicitudes/solicitud-1758233792694-112181033.jpg', '2025-09-18 19:16:32'),
(6, 1, 1, 'Canilla Rota', 'Se me rompio la canilla del fregadero', 'Vicente Lopez y Planes 545', 1, 1, 'alta', NULL, '2025-09-20 15:53:08'),
(7, 1, 4, 'Necesito cortas unas maderas para un proyecto benefico', '10 Maderas de 10x40\n4 de 80x25', 'Vicente Lopez y Planes 545', 1, 1, 'media', NULL, '2025-09-20 16:17:53'),
(8, 1, 4, 'NEcesito una puerta', 'Puerta Grande con molduras y dos ventanas', 'Vicente Lopez y Planes 545', 1, 1, 'baja', '/uploads/solicitudes/solicitud-1758564395731-571345071.jpg', '2025-09-22 15:06:35'),
(9, 1, 4, 'Mesa 4 patas', 'No contestar esto es una prueba', 'Vicente Lopez y Planes 545', 1, 3, 'media', NULL, '2025-10-25 16:04:10'),
(10, 1, 4, 'Mauri es gei', 'Mauri tiene gei', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-10-25 17:04:27'),
(11, 1, 4, 'Ahora mauri come hombres', 'mauri come hombres ayuda xd', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-10-25 17:15:51'),
(12, 1, 4, 'Ahora mauri come 4 hombres', '4 hombres xd', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-11-06 19:20:01'),
(13, 1, 1, 'Mauri se le cruzan los cables', 'mauri va a la pesada a buscar trabas', 'Vicente Lopez y Planes 545', 1, 6, 'media', NULL, '2025-11-06 19:59:03'),
(14, 1, 1, 'Mauri trafica merca en la costa', '2 mil de merca.\r\n3 la pasta xd', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-11-06 20:37:25'),
(15, 1, 1, 'pruebahorario', 'testhorario', 'Vicente Lopez y Planes 545', 1, 1, 'alta', NULL, '2025-11-06 20:55:49'),
(16, 1, 1, 'pruebaformularios', 'prueba2500', 'Vicente Lopez y Planes 545', 1, 6, 'alta', '/uploads/solicitudes/solicitud-1762720974323-195191787.png', '2025-11-09 17:42:54'),
(17, 1, 1, 'prueba de formulario horarios', 'horariosedsdasdsadasdas', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-11-09 17:54:59'),
(18, 1, 1, 'testeoformularios', 'testfgfgfddffd', 'Vicente Lopez y Planes 545', 1, 6, 'baja', '/uploads/solicitudes/solicitud-1762723196050-448862631.jpg', '2025-11-09 18:19:56'),
(19, 1, 1, 'testeocalificacion', 'testpuytodsfds', 'Vicente Lopez y Planes 545', 1, 6, 'media', NULL, '2025-11-09 18:36:44'),
(20, 1, 4, 'testeocalificacion1', 'testeocalificacion1', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-11-09 18:46:29'),
(21, 1, 4, 'testeocalificacion2', 'testeocalificacion2', 'Vicente Lopez y Planes 545', 1, 6, 'alta', NULL, '2025-11-09 18:46:40'),
(22, 1, 4, 'testeocalificacion3', 'testeocalificacion3', 'Vicente Lopez y Planes 545', 1, 6, 'media', NULL, '2025-11-09 18:46:53'),
(23, 1, 1, 'Testeohorarios1', 'Testeohorarios1', 'Vicente Lopez y Planes 545', 1, 6, 'media', NULL, '2025-11-09 20:05:26'),
(24, 1, 1, 'Testeohorarios2', 'Testeohorarios2', 'Vicente Lopez y Planes 545', 1, 6, 'media', NULL, '2025-11-09 20:05:45'),
(25, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Vicente Lopez y Planes 545', 1, 1, 'alta', NULL, '2026-05-30 16:24:12'),
(26, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Vicente Lopez y Planes 545', 1, 1, 'alta', NULL, '2026-05-30 16:24:19'),
(27, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Buenos aires 232', 1, 1, 'alta', NULL, '2026-05-30 16:24:40'),
(28, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Buenos aires 232', 1, 1, 'alta', NULL, '2026-05-30 16:24:53'),
(29, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Buenos aires 232', 2, 1, 'alta', NULL, '2026-05-30 16:25:03'),
(30, 1, 1, 'pruebanuevaa', 'este es una pruebaaa', 'Buenos aires 232', 1, 1, 'alta', NULL, '2026-05-30 16:25:09'),
(31, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Buenos aires 232', 1, 1, 'alta', NULL, '2026-05-30 16:25:13'),
(32, 1, 4, 'pruebanuevaa', 'este es una pruebaaa', 'Vicente Lopez y Planes 545', 1, 1, 'alta', NULL, '2026-05-30 16:26:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_profesional`
--

CREATE TABLE `tipo_profesional` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `tipo_profesional`
--

INSERT INTO `tipo_profesional` (`id`, `nombre`, `estado`) VALUES
(1, 'Electricidad', 1),
(2, 'Gas', 0),
(3, 'Plomeria', 0),
(4, 'Carpinteria', 1),
(5, 'Pintura', 0),
(6, 'Herreria', 0),
(7, 'Albañileria', 0),
(8, 'Cerrajeria', 0),
(9, 'Nueva Categoria', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `fecha_creacion` date NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `rol` enum('admin','cliente','profesional') NOT NULL DEFAULT 'cliente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `correo`, `nombre_usuario`, `contraseña`, `fecha_creacion`, `activo`, `rol`) VALUES
(1, 'cliente@gmail.com', 'primercli', '1234567', '2025-08-24', 1, 'cliente'),
(3, 'admin@gmail.com', 'administrador', 'a7R!k9Q', '2025-08-01', 1, 'admin'),
(4, 'profesional@gmail.com', 'profesionalconfoto', '123456789', '2025-09-14', 1, 'profesional'),
(5, 'profesional23@gmail.com', 'profesionalconfoto1', '1234567890', '2025-09-14', 1, 'profesional'),
(6, 'hachazo@hacha.com', 'carpintero', '123456789', '2025-09-20', 1, 'profesional'),
(7, 'dsadsa@gmail.com', 'sadasd', 'dasdasda', '2025-09-22', 1, 'cliente'),
(8, 'nanana@batman.us', 'nana', '123456', '2025-10-16', 1, 'profesional'),
(9, 'correo@mail.com', 'pro', '123456', '2025-10-16', 1, 'profesional'),
(10, 'pruebalaplata@gmail.com', 'laplata', '123456789', '2025-11-06', 1, 'profesional');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_solicitud_calificador` (`solicitud_id`,`calificador_persona_id`),
  ADD UNIQUE KEY `uq_solicitud_calificado` (`solicitud_id`,`calificado_persona_id`),
  ADD KEY `idx_calificador` (`calificador_persona_id`),
  ADD KEY `idx_calificado` (`calificado_persona_id`),
  ADD KEY `idx_solicitud` (`solicitud_id`);

--
-- Indices de la tabla `cliente_hogar`
--
ALTER TABLE `cliente_hogar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `localidad_id` (`localidad_id`);

--
-- Indices de la tabla `estado_sol_servicio`
--
ALTER TABLE `estado_sol_servicio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `historial_servicio`
--
ALTER TABLE `historial_servicio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hist_sol` (`solicitud_id`),
  ADD KEY `idx_hist_estado` (`estado_id`);

--
-- Indices de la tabla `horario_dia`
--
ALTER TABLE `horario_dia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_horariodia_horario` (`horario_id`,`dia_semana`);

--
-- Indices de la tabla `horario_profesional`
--
ALTER TABLE `horario_profesional`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_horarioprof_prof_vigencia` (`profesional_id`,`fechaInicio`,`fechaFin`);

--
-- Indices de la tabla `localidad`
--
ALTER TABLE `localidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `provincia_id` (`provincia_id`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_tipo_ref` (`tipo_notificacion`,`referencia_id`);

--
-- Indices de la tabla `orden_de_trabajo`
--
ALTER TABLE `orden_de_trabajo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ot_presupuesto` (`presupuesto_id`),
  ADD KEY `fk_ot_cliente` (`cliente_persona_id`),
  ADD KEY `fk_ot_prev` (`previous_orden_id`),
  ADD KEY `ix_ot_solicitud_active` (`solicitud_id`,`is_active`),
  ADD KEY `ix_ot_prof` (`profesional_id`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_presu_solicitud` (`solicitud_id`),
  ADD KEY `idx_presu_prof` (`profesional_persona_id`);

--
-- Indices de la tabla `profesional`
--
ALTER TABLE `profesional`
  ADD PRIMARY KEY (`id`),
  ADD KEY `localidad_id` (`localidad_id`);

--
-- Indices de la tabla `profesional_agenda`
--
ALTER TABLE `profesional_agenda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agenda_prof_fecha` (`profesional_id`,`fecha`,`horaInicio`),
  ADD KEY `idx_agenda_solicitud` (`solicitud_id`);

--
-- Indices de la tabla `profesional_tipo`
--
ALTER TABLE `profesional_tipo`
  ADD PRIMARY KEY (`profesional_id`,`tipo_profesional_id`),
  ADD KEY `fk_pt_tipo` (`tipo_profesional_id`);

--
-- Indices de la tabla `provincia`
--
ALTER TABLE `provincia`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sesion_usuario` (`usuario_id`);

--
-- Indices de la tabla `solicitud_servicio`
--
ALTER TABLE `solicitud_servicio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ss_cliente` (`cliente_persona_id`),
  ADD KEY `fk_ss_localidad` (`localidad_id`),
  ADD KEY `idx_ss_tipo_localidad` (`tipo_profesional_id`,`localidad_id`),
  ADD KEY `idx_ss_estado` (`estado_id`),
  ADD KEY `idx_ss_prioridad` (`prioridad`);

--
-- Indices de la tabla `tipo_profesional`
--
ALTER TABLE `tipo_profesional`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`nombre_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `estado_sol_servicio`
--
ALTER TABLE `estado_sol_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `historial_servicio`
--
ALTER TABLE `historial_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `horario_dia`
--
ALTER TABLE `horario_dia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `horario_profesional`
--
ALTER TABLE `horario_profesional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `localidad`
--
ALTER TABLE `localidad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `orden_de_trabajo`
--
ALTER TABLE `orden_de_trabajo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `profesional_agenda`
--
ALTER TABLE `profesional_agenda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `provincia`
--
ALTER TABLE `provincia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sesion`
--
ALTER TABLE `sesion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `solicitud_servicio`
--
ALTER TABLE `solicitud_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `tipo_profesional`
--
ALTER TABLE `tipo_profesional`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD CONSTRAINT `fk_calif_calificado` FOREIGN KEY (`calificado_persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_calif_calificador` FOREIGN KEY (`calificador_persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_calif_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud_servicio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cliente_hogar`
--
ALTER TABLE `cliente_hogar`
  ADD CONSTRAINT `cliente_hogar_ibfk_1` FOREIGN KEY (`id`) REFERENCES `persona` (`id`),
  ADD CONSTRAINT `cliente_hogar_ibfk_2` FOREIGN KEY (`localidad_id`) REFERENCES `localidad` (`id`);

--
-- Filtros para la tabla `historial_servicio`
--
ALTER TABLE `historial_servicio`
  ADD CONSTRAINT `fk_hist_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_sol_servicio` (`id`),
  ADD CONSTRAINT `fk_hist_ss` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud_servicio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `horario_dia`
--
ALTER TABLE `horario_dia`
  ADD CONSTRAINT `fk_hd_horarioprof` FOREIGN KEY (`horario_id`) REFERENCES `horario_profesional` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `horario_profesional`
--
ALTER TABLE `horario_profesional`
  ADD CONSTRAINT `fk_horarioprof_prof` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `localidad`
--
ALTER TABLE `localidad`
  ADD CONSTRAINT `localidad_ibfk_1` FOREIGN KEY (`provincia_id`) REFERENCES `provincia` (`id`);

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `orden_de_trabajo`
--
ALTER TABLE `orden_de_trabajo`
  ADD CONSTRAINT `fk_ot_cliente` FOREIGN KEY (`cliente_persona_id`) REFERENCES `persona` (`id`),
  ADD CONSTRAINT `fk_ot_presupuesto` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuesto` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ot_prev` FOREIGN KEY (`previous_orden_id`) REFERENCES `orden_de_trabajo` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ot_profesional` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`),
  ADD CONSTRAINT `fk_ot_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud_servicio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `persona`
--
ALTER TABLE `persona`
  ADD CONSTRAINT `persona_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Filtros para la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  ADD CONSTRAINT `fk_presu_profesional` FOREIGN KEY (`profesional_persona_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_presu_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud_servicio` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `profesional`
--
ALTER TABLE `profesional`
  ADD CONSTRAINT `profesional_ibfk_1` FOREIGN KEY (`id`) REFERENCES `persona` (`id`),
  ADD CONSTRAINT `profesional_ibfk_3` FOREIGN KEY (`localidad_id`) REFERENCES `localidad` (`id`);

--
-- Filtros para la tabla `profesional_tipo`
--
ALTER TABLE `profesional_tipo`
  ADD CONSTRAINT `fk_pt_profesional` FOREIGN KEY (`profesional_id`) REFERENCES `profesional` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pt_tipo` FOREIGN KEY (`tipo_profesional_id`) REFERENCES `tipo_profesional` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD CONSTRAINT `fk_sesion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solicitud_servicio`
--
ALTER TABLE `solicitud_servicio`
  ADD CONSTRAINT `fk_ss_cliente` FOREIGN KEY (`cliente_persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ss_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_sol_servicio` (`id`),
  ADD CONSTRAINT `fk_ss_localidad` FOREIGN KEY (`localidad_id`) REFERENCES `localidad` (`id`),
  ADD CONSTRAINT `fk_ss_tipo` FOREIGN KEY (`tipo_profesional_id`) REFERENCES `tipo_profesional` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
