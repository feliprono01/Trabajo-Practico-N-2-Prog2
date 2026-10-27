-- phpMyAdmin SQL Dump (adaptado)
-- Base de datos: `clinica` — versión ampliada para TP integrador (entrega semanas 2 a 4)
-- Nota: las columnas de ID pasaron de `tinyint` a `int` respecto de la versión de semana 1,
-- porque tinyint solo soporta hasta 127 filas y los datos de prueba de esta entrega lo superan.
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `clinica` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `clinica`;

-- --------------------------------------------------------
-- Tabla: sede
-- --------------------------------------------------------
CREATE TABLE `sede` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `telefono` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `sede` (`id`, `nombre`, `direccion`, `telefono`) VALUES
(1, 'Sede Centro', 'San Martín 123', '3424000001'),
(2, 'Sede Norte', 'Av. Rivadavia 456', '3424000002');

-- --------------------------------------------------------
-- Tabla: cobertura
-- --------------------------------------------------------
CREATE TABLE `cobertura` (
  `id` int(11) NOT NULL,
  `nombre` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `cobertura` (`id`, `nombre`) VALUES
(1, 'Jerarquicos'),
(2, 'OSDE');

-- --------------------------------------------------------
-- Tabla: especialidad
-- --------------------------------------------------------
CREATE TABLE `especialidad` (
  `id` int(11) NOT NULL,
  `descripcion` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `especialidad` (`id`, `descripcion`) VALUES
(1, 'Traumatologia'),
(2, 'Clinica Medica'),
(3, 'Pediatria');

-- --------------------------------------------------------
-- Tabla: usuario
-- --------------------------------------------------------
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `apellido` varchar(30) NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(20) NOT NULL,
  `email` varchar(30) NOT NULL,
  `telefono` varchar(10) NOT NULL,
  `dni` varchar(8) NOT NULL,
  `id_sede` int(11) DEFAULT NULL,
  `id_cobertura` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Nota: los hashes originales del script eran de ejemplo y no permitían hacer login.
-- Se reemplazaron por hashes bcrypt reales para poder probar los endpoints protegidos por rol.
-- Todos los usuarios de prueba tienen la misma contraseña: Test1234!
-- (el hash bcrypt se reutiliza entre filas nuevas porque incluye su propio salt y verifica igual).
INSERT INTO `usuario` (`id`, `apellido`, `nombre`, `fecha_nacimiento`, `password`, `rol`, `email`, `telefono`, `dni`, `id_sede`, `id_cobertura`) VALUES
(1, 'Perez', 'Juan', '1995-12-30', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'operador', 'jperez@gmail.com', '3424568897', '15200548', 1, NULL),
(2, 'Friggeri', 'Franco', '1998-03-14', '$2b$10$knPMfG3Q1pRi3Qh3kaHhpuYxWARwVm40C57jxT4cy3LjBuBuJt77G', 'paciente', 'asdas@gaasds.com', '342545555', '36000960', NULL, 1),
(3, 'Lopez', 'Ana', '1980-05-10', '$2b$10$YVc6awn2407.DmikaPcE4.G77bojrQXdtopq/Y6M2ASXLN.l0A0Sm', 'medico', 'alopez@clinica.com', '3424111222', '20111222', 1, NULL),
(4, 'Gomez', 'Marcos', '1975-08-01', '$2b$10$bqyveXASlK8fNAbk8CF/l.wgPatSTTLGtqXrS0JWWTYgMg/IOv3VO', 'admin', 'mgomez@clinica.com', '3424222333', '18222333', NULL, NULL),
(5, 'Garcia', 'Pedro', '1978-02-18', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'medico', 'pgarcia@clinica.com', '3424333444', '21333444', 1, NULL),
(6, 'Martinez', 'Sofia', '1985-07-22', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'medico', 'smartinez@clinica.com', '3424444555', '22444555', 1, NULL),
(7, 'Diaz', 'Laura', '1992-11-09', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'paciente', 'ldiaz@gmail.com', '3424555666', '30555666', NULL, 2),
(8, 'Rodriguez', 'Diego', '1990-04-05', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'operador', 'drodriguez@clinica.com', '3424666777', '28666777', 2, NULL),
(9, 'Fernandez', 'Carla', '2001-09-30', '$2b$10$28wKMil.R94PTUa.58jPn.fPgocSsZrXYjaMcqQMrfCjohrpb/IoK', 'paciente', 'cfernandez@gmail.com', '3424777888', '40777888', NULL, 1);

-- --------------------------------------------------------
-- Tabla: medico_especialidad
-- --------------------------------------------------------
CREATE TABLE `medico_especialidad` (
  `id` int(11) NOT NULL,
  `id_medico` int(11) NOT NULL,
  `id_especialidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `medico_especialidad` (`id`, `id_medico`, `id_especialidad`) VALUES
(1, 3, 1),
(2, 5, 2),
(3, 6, 3);

-- --------------------------------------------------------
-- Tabla: agenda
-- --------------------------------------------------------
CREATE TABLE `agenda` (
  `id` int(11) NOT NULL,
  `hora_entrada` varchar(5) NOT NULL,
  `hora_salida` varchar(5) NOT NULL,
  `fecha` date NOT NULL,
  `id_medico` int(11) NOT NULL,
  `id_especialidad` int(11) NOT NULL,
  `id_sede` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Ana Lopez (Traumatologia) atiende en Sede Centro varios días.
-- Sofia Martinez (Pediatria) atiende en Sede Centro Y en Sede Norte (médica multi-sede).
INSERT INTO `agenda` (`id`, `hora_entrada`, `hora_salida`, `fecha`, `id_medico`, `id_especialidad`, `id_sede`) VALUES
(1, '09:00', '13:00', '2026-10-27', 3, 1, 1),
(2, '09:00', '13:00', '2026-10-28', 3, 1, 1),
(3, '09:00', '13:00', '2026-10-29', 3, 1, 1),
(4, '14:00', '18:00', '2026-10-27', 5, 2, 1),
(5, '08:00', '12:00', '2026-10-27', 6, 3, 1),
(6, '08:00', '12:00', '2026-10-28', 6, 3, 2);

-- --------------------------------------------------------
-- Tabla: turno
-- --------------------------------------------------------
CREATE TABLE `turno` (
  `id` int(11) NOT NULL,
  `nota` varchar(40) DEFAULT NULL,
  `id_agenda` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `hora` varchar(5) DEFAULT NULL,
  `id_paciente` int(11) NOT NULL,
  `id_cobertura` int(11) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'confirmado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Turnos en los tres estados posibles, repartidos entre los médicos de prueba.
INSERT INTO `turno` (`id`, `nota`, `id_agenda`, `fecha`, `hora`, `id_paciente`, `id_cobertura`, `estado`) VALUES
(1, 'Control de estudio', 1, '2026-10-27', '09:30', 2, 1, 'atendido'),
(2, 'Dolor de rodilla', 1, '2026-10-27', '10:00', 7, 2, 'confirmado'),
(3, 'Chequeo general', 1, '2026-10-27', '10:30', 9, 1, 'cancelado'),
(4, 'Control de presión', 4, '2026-10-27', '14:30', 2, 1, 'confirmado'),
(5, 'Control pediátrico', 5, '2026-10-27', '08:30', 7, 2, 'atendido');

-- --------------------------------------------------------
-- Tabla: historial_clinico
-- --------------------------------------------------------
CREATE TABLE `historial_clinico` (
  `id` int(11) NOT NULL,
  `id_turno` int(11) NOT NULL,
  `id_medico` int(11) NOT NULL,
  `id_paciente` int(11) NOT NULL,
  `diagnostico` varchar(255) NOT NULL,
  `tratamiento` varchar(255) DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `historial_clinico` (`id`, `id_turno`, `id_medico`, `id_paciente`, `diagnostico`, `tratamiento`, `observaciones`, `fecha_registro`) VALUES
(1, 1, 3, 2, 'Esguince de tobillo grado I', 'Reposo y antiinflamatorios', 'Control en 15 dias', '2026-10-27 09:50:00'),
(2, 5, 6, 7, 'Control pediátrico de rutina', 'Ninguno', 'Paciente sano, próximo control en 6 meses', '2026-10-27 08:50:00');

-- --------------------------------------------------------
-- Tabla: log_auditoria
-- --------------------------------------------------------
CREATE TABLE `log_auditoria` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(20) NOT NULL,
  `entidad` varchar(30) NOT NULL,
  `id_entidad` int(11) DEFAULT NULL,
  `detalle` varchar(255) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `log_auditoria` (`id`, `id_usuario`, `accion`, `entidad`, `id_entidad`, `detalle`, `fecha`) VALUES
(1, 4, 'ALTA', 'usuario', 2, 'Alta de paciente Friggeri Franco', '2025-10-01 10:00:00');

-- --------------------------------------------------------
-- Tabla: notificacion
-- --------------------------------------------------------
CREATE TABLE `notificacion` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

INSERT INTO `notificacion` (`id`, `id_usuario`, `tipo`, `mensaje`, `leida`, `fecha`) VALUES
(1, 2, 'turno_confirmado', 'Tu turno del 27/10/2026 a las 09:30 fue confirmado.', 1, '2026-10-20 09:00:00'),
(2, 3, 'turno_atendido', 'Registraste el turno de Franco Friggeri como atendido.', 0, '2026-10-27 09:50:00'),
(3, 7, 'turno_confirmado', 'Tu turno del 27/10/2026 a las 10:00 fue confirmado.', 0, '2026-10-20 09:05:00'),
(4, 9, 'turno_cancelado', 'Tu turno del 27/10/2026 a las 10:30 fue cancelado.', 0, '2026-10-26 12:00:00'),
(5, 6, 'turno_atendido', 'Registraste el turno de Laura Diaz como atendido.', 0, '2026-10-27 08:50:00'),
(6, 2, 'turno_confirmado', 'Tu turno del 27/10/2026 a las 14:30 fue confirmado.', 0, '2026-10-21 09:00:00');

-- --------------------------------------------------------
-- Índices y PKs
-- --------------------------------------------------------
ALTER TABLE `sede` ADD PRIMARY KEY (`id`);
ALTER TABLE `cobertura` ADD PRIMARY KEY (`id`);
ALTER TABLE `especialidad` ADD PRIMARY KEY (`id`);

ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_sede` (`id_sede`),
  ADD KEY `id_cobertura` (`id_cobertura`);

ALTER TABLE `medico_especialidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_medico` (`id_medico`),
  ADD KEY `id_especialidad` (`id_especialidad`);

ALTER TABLE `agenda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_especialidad` (`id_especialidad`),
  ADD KEY `id_medico` (`id_medico`),
  ADD KEY `id_sede` (`id_sede`);

ALTER TABLE `turno`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_agenda` (`id_agenda`),
  ADD KEY `id_paciente` (`id_paciente`),
  ADD KEY `id_cobertura` (`id_cobertura`);

ALTER TABLE `historial_clinico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_turno` (`id_turno`),
  ADD KEY `id_medico` (`id_medico`),
  ADD KEY `id_paciente` (`id_paciente`);

ALTER TABLE `log_auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

-- --------------------------------------------------------
-- AUTO_INCREMENT
-- --------------------------------------------------------
ALTER TABLE `sede` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `cobertura` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `especialidad` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `usuario` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
ALTER TABLE `medico_especialidad` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `agenda` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `turno` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
ALTER TABLE `historial_clinico` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
ALTER TABLE `log_auditoria` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
ALTER TABLE `notificacion` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

-- --------------------------------------------------------
-- Foreign Keys
-- --------------------------------------------------------
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id`),
  ADD CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`id_cobertura`) REFERENCES `cobertura` (`id`);

ALTER TABLE `medico_especialidad`
  ADD CONSTRAINT `medico_especialidad_ibfk_1` FOREIGN KEY (`id_medico`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `medico_especialidad_ibfk_2` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id`);

ALTER TABLE `agenda`
  ADD CONSTRAINT `agenda_ibfk_1` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id`),
  ADD CONSTRAINT `agenda_ibfk_2` FOREIGN KEY (`id_medico`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `agenda_ibfk_3` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id`);

ALTER TABLE `turno`
  ADD CONSTRAINT `turno_ibfk_1` FOREIGN KEY (`id_agenda`) REFERENCES `agenda` (`id`),
  ADD CONSTRAINT `turno_ibfk_2` FOREIGN KEY (`id_paciente`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `turno_ibfk_3` FOREIGN KEY (`id_cobertura`) REFERENCES `cobertura` (`id`);

ALTER TABLE `historial_clinico`
  ADD CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`id_turno`) REFERENCES `turno` (`id`),
  ADD CONSTRAINT `historial_ibfk_2` FOREIGN KEY (`id_medico`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `historial_ibfk_3` FOREIGN KEY (`id_paciente`) REFERENCES `usuario` (`id`);

ALTER TABLE `log_auditoria`
  ADD CONSTRAINT `log_auditoria_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`);

ALTER TABLE `notificacion`
  ADD CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
