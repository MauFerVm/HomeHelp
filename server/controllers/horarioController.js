// controllers/horarioController.js
const horarioModel = require('../models/horarioProfesionalModel');
const ordenTrabajoModel = require('../models/ordenTrabajoModel');
const Notificacion = require('../models/notificacionModel');
const db = require('../config/db');

/**
 * Obtener horarios disponibles de un profesional para una semana específica
 */
const getHorariosDisponibles = async (req, res) => {
    try {
        const { profesionalId } = req.params;
        const { fechaInicio, duracion, ordenId } = req.query;
        
        console.log('\n========================================');
        console.log('[DEBUG] getHorariosDisponibles llamado');
        console.log('[DEBUG] profesionalId:', profesionalId);
        console.log('[DEBUG] fechaInicio:', fechaInicio);
        console.log('[DEBUG] duracion:', duracion);
        console.log('========================================\n');

        if (!fechaInicio || !duracion) {
            return res.status(400).json({
                success: false,
                message: 'fechaInicio y duracion son requeridos'
            });
        }

        // Validar que la fecha no sea anterior a la semana actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaConsulta = new Date(fechaInicio + 'T00:00:00');
        
        // Calcular el lunes de la semana actual usando UTC para evitar problemas de zona horaria
        const diaSemana = hoy.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
        const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar para que Lunes sea 0
        const lunesActual = new Date(hoy);
        lunesActual.setUTCDate(hoy.getUTCDate() - diasHastaLunes);
        lunesActual.setUTCHours(0, 0, 0, 0);
        
        // Permitir consultar la semana actual (lunesActual) pero no semanas anteriores
        if (fechaConsulta.getTime() < lunesActual.getTime()) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden consultar fechas anteriores a la semana actual'
            });
        }

        // Calcular fecha fin (7 días después)
        const fechaFin = new Date(fechaConsulta);
        fechaFin.setDate(fechaFin.getDate() + 6);

        let excluirAgendaId = null;
        if (ordenId) {
            const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);
            if (orden) {
                const agendaActual = await horarioModel.getAgendaBySolicitud(
                    orden.solicitud_id,
                    orden.profesional_id
                );
                if (agendaActual) {
                    excluirAgendaId = agendaActual.id;
                }
            }
        }

        // Obtener horarios activos del profesional
        const horariosActivos = await horarioModel.getHorariosActivos(
            profesionalId, 
            fechaInicio, 
            fechaFin.toISOString().split('T')[0]
        );

        // Obtener agenda ocupada
        const agendaOcupada = await horarioModel.getAgendaOcupada(
            profesionalId,
            fechaInicio,
            fechaFin.toISOString().split('T')[0],
            excluirAgendaId
        );

        // Procesar horarios disponibles
        const horariosDisponibles = procesarHorariosDisponibles(
            horariosActivos,
            agendaOcupada,
            fechaInicio,
            parseInt(duracion)
        );

        res.json({
            success: true,
            data: {
                fechaInicio,
                fechaFin: fechaFin.toISOString().split('T')[0],
                horariosDisponibles
            }
        });

    } catch (error) {
        console.error('Error al obtener horarios disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Confirmar horario seleccionado y crear entrada en agenda y orden de trabajo
 */
const confirmarHorario = async (req, res) => {
    try {
        const { presupuestoId } = req.params;
        const { fecha, horaInicio, horaFin } = req.body;

        if (!fecha || !horaInicio || !horaFin) {
            return res.status(400).json({
                success: false,
                message: 'fecha, horaInicio y horaFin son requeridos'
            });
        }

        // Obtener información del presupuesto completa (incluyendo monto y descripcion)
        const presupuestoQuery = `
            SELECT 
                p.id,
                p.solicitud_id,
                p.profesional_persona_id,
                p.duracion,
                p.estado,
                p.monto,
                p.descripcion
            FROM presupuesto p
            WHERE p.id = ?
        `;
        
        const [presupuestoRows] = await db.execute(presupuestoQuery, [presupuestoId]);
        
        if (presupuestoRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Presupuesto no encontrado'
            });
        }

        const presupuesto = presupuestoRows[0];

        if (presupuesto.estado !== 'enviado') {
            return res.status(400).json({
                success: false,
                message: 'El presupuesto ya fue procesado'
            });
        }

        // El profesional_persona_id del presupuesto ES el ID de la tabla persona/profesional
        // (profesional.id = persona.id por la relación 1:1)
        const profesionalId = presupuesto.profesional_persona_id;

        // Obtener ID del cliente (persona) desde la solicitud
        const solicitudQuery = `
            SELECT cliente_persona_id
            FROM solicitud_servicio
            WHERE id = ?
        `;
        
        const [solicitudRows] = await db.execute(solicitudQuery, [presupuesto.solicitud_id]);
        
        if (solicitudRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const clientePersonaId = solicitudRows[0].cliente_persona_id;

        // Verificar disponibilidad
        const disponible = await horarioModel.verificarDisponibilidad(
            profesionalId,
            fecha,
            horaInicio,
            horaFin
        );

        if (!disponible) {
            return res.status(409).json({
                success: false,
                message: 'El horario seleccionado ya no está disponible'
            });
        }

        // Iniciar transacción (usar query() porque execute() no soporta comandos de transacción)
        await db.query('START TRANSACTION');

        try {
            // Crear entrada en agenda
            const agendaId = await horarioModel.crearEntradaAgenda(
                profesionalId,
                presupuesto.solicitud_id,
                presupuestoId,
                fecha,
                horaInicio,
                horaFin,
                'pendiente'
            );

            // Actualizar estado del presupuesto
            await db.execute(
                'UPDATE presupuesto SET estado = ? WHERE id = ?',
                ['aceptado', presupuestoId]
            );

            // Crear orden de trabajo
            const ordenTrabajoId = await ordenTrabajoModel.crearOrdenTrabajo({
                presupuesto_id: presupuestoId,
                solicitud_id: presupuesto.solicitud_id,
                profesional_id: profesionalId,
                cliente_persona_id: clientePersonaId,
                monto: presupuesto.monto,
                descripcion: presupuesto.descripcion,
                fecha_programada: fecha,
                horarioInicio: horaInicio,
                horaFin: horaFin,
                estado: 'pendiente',
                is_active: 1
            });

            await ordenTrabajoModel.crearHistorialOrden(
                ordenTrabajoId,
                null,
                'pendiente',
                'Orden de trabajo creada al confirmar horario'
            );

            // Crear registro en historial_servicio con estado "presupuesto aceptado"
            // Primero obtener el ID del estado y sus vencimiento_dias
            const [estadoRows] = await db.execute(
                'SELECT id, vencimiento_dias FROM estado_sol_servicio WHERE nombre = ?',
                ['presupuesto aceptado']
            );

            if (estadoRows.length > 0) {
                const estadoPresupuestoAceptado = estadoRows[0];
                const fechaCreacion = new Date();
                
                // Calcular fecha de vencimiento si tiene días configurados
                let fechaVencimiento = null;
                if (estadoPresupuestoAceptado.vencimiento_dias > 0) {
                    fechaVencimiento = new Date(fechaCreacion);
                    fechaVencimiento.setDate(fechaVencimiento.getDate() + estadoPresupuestoAceptado.vencimiento_dias);
                }

                // Insertar en historial_servicio
                await db.execute(
                    `INSERT INTO historial_servicio 
                    (solicitud_id, fecha_creacion, fecha_vencimiento, estado_id, notas) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        presupuesto.solicitud_id,
                        fechaCreacion,
                        fechaVencimiento,
                        estadoPresupuestoAceptado.id,
                        'Presupuesto aceptado'
                    ]
                );

                // Actualizar el estado de la solicitud de servicio
                await db.execute(
                    'UPDATE solicitud_servicio SET estado_id = ? WHERE id = ?',
                    [estadoPresupuestoAceptado.id, presupuesto.solicitud_id]
                );
            }

            // Crear notificación para el profesional
            // Obtener nombre del cliente y título de la solicitud
            const [datosNotificacion] = await db.execute(
                `SELECT 
                    p.nombre_apellido as nombre_cliente,
                    ss.titulo as titulo_solicitud,
                    prof.usuario_id as profesional_usuario_id
                FROM solicitud_servicio ss
                INNER JOIN persona p ON ss.cliente_persona_id = p.id
                INNER JOIN persona prof ON prof.id = ?
                WHERE ss.id = ?`,
                [profesionalId, presupuesto.solicitud_id]
            );

            if (datosNotificacion.length > 0) {
                const { nombre_cliente, titulo_solicitud, profesional_usuario_id } = datosNotificacion[0];
                const mensajeNotificacion = `${nombre_cliente} aceptó tu presupuesto: ${titulo_solicitud}`;

                await Notificacion.crear({
                    usuario_id: profesional_usuario_id,
                    tipo_notificacion: 'solicitud',
                    referencia_id: presupuesto.solicitud_id,
                    mensaje: mensajeNotificacion
                }, db);
            }

            // Confirmar transacción
            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Horario confirmado y orden de trabajo creada exitosamente',
                data: {
                    agendaId,
                    presupuestoId,
                    ordenTrabajoId,
                    fecha,
                    horaInicio,
                    horaFin
                }
            });

        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al confirmar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Función auxiliar para procesar horarios disponibles
 */
function procesarHorariosDisponibles(horariosActivos, agendaOcupada, fechaInicio, duracionMinutos) {
    const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaInicioObj = new Date(fechaInicio);
    const horariosPorDia = {};

    // Inicializar estructura por día
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(fechaInicioObj);
        fecha.setDate(fecha.getDate() + i);
        
        // Calcular el día de la semana real de esta fecha
        const diaNumero = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        // Convertir a índice donde Lunes=0, Domingo=6
        const diaIndex = diaNumero === 0 ? 6 : diaNumero - 1;
        const diaSemana = diasSemana[diaIndex];
        
        // Solo incluir días futuros o hoy
        if (fecha >= hoy) {
            horariosPorDia[diaSemana] = {
                fecha: getFechaLocal(fecha), // Usar fecha local en lugar de UTC
                horarios: [],
                esPasado: fecha < hoy
            };
        }
    }

    // Agrupar horarios por día, manteniendo información de rango de fechas
    const horariosPorDiaSemana = {};
    horariosActivos.forEach(horario => {
        if (!horariosPorDiaSemana[horario.dia_semana]) {
            horariosPorDiaSemana[horario.dia_semana] = [];
        }
        horariosPorDiaSemana[horario.dia_semana].push({
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            fechaInicio: horario.fechaInicio,
            fechaFin: horario.fechaFin
        });
    });

    // Crear agenda ocupada por fecha
    const agendaPorFecha = {};
    agendaOcupada.forEach(entrada => {
        // Asegurarse de que la fecha esté en formato YYYY-MM-DD
        const fechaFormateada = entrada.fecha instanceof Date 
            ? getFechaLocal(entrada.fecha) 
            : entrada.fecha.split('T')[0]; // Si viene como datetime, tomar solo la fecha
        
        if (!agendaPorFecha[fechaFormateada]) {
            agendaPorFecha[fechaFormateada] = [];
        }
        agendaPorFecha[fechaFormateada].push({
            horaInicio: entrada.horaInicio,
            horaFin: entrada.horaFin
        });
    });
    

    // Procesar cada día
    Object.keys(horariosPorDia).forEach(diaSemana => {
        const diaInfo = horariosPorDia[diaSemana];
        const fecha = diaInfo.fecha;
        
        if (horariosPorDiaSemana[diaSemana]) {
            // Filtrar horarios que son válidos para esta fecha específica
            const horariosValidosParaFecha = horariosPorDiaSemana[diaSemana].filter(horario => {
                const fechaActual = new Date(fecha);
                const fechaInicioHorario = new Date(horario.fechaInicio);
                const fechaFinHorario = horario.fechaFin ? new Date(horario.fechaFin) : null;
                
                // Verificar que la fecha esté dentro del rango del horario
                const despuesDeFechaInicio = fechaActual >= fechaInicioHorario;
                const antesDeFechaFin = !fechaFinHorario || fechaActual <= fechaFinHorario;
                
                return despuesDeFechaInicio && antesDeFechaFin;
            });
            
            // Si hay horarios válidos para esta fecha, fusionarlos y calcular disponibilidad
            if (horariosValidosParaFecha.length > 0) {
                const rangosFusionados = fusionarRangosHorarios(horariosValidosParaFecha);
                
                rangosFusionados.forEach(horario => {
                    const horariosOcupadosParaEstaFecha = agendaPorFecha[fecha] || [];
                    
                    const horariosDisponibles = calcularHorariosDisponibles(
                        horario,
                        horariosOcupadosParaEstaFecha,
                        duracionMinutos,
                        fecha // Pasar la fecha para filtrar horarios pasados
                    );
                    
                    diaInfo.horarios.push(...horariosDisponibles);
                });
            }
        }
    });

    return horariosPorDia;
}

/**
 * Fusionar rangos horarios que se superponen o son contiguos
 */
function fusionarRangosHorarios(rangos) {
    if (rangos.length === 0) return [];
    
    // Convertir a formato decimal y ordenar por hora de inicio
    const rangosDecimales = rangos.map(r => ({
        inicio: parseTime(r.horaInicio),
        fin: parseTime(r.horaFin)
    })).sort((a, b) => a.inicio - b.inicio);
    
    const rangosFusionados = [rangosDecimales[0]];
    
    for (let i = 1; i < rangosDecimales.length; i++) {
        const rangoActual = rangosDecimales[i];
        const ultimoFusionado = rangosFusionados[rangosFusionados.length - 1];
        
        // Si el rango actual se superpone o es contiguo al último fusionado
        if (rangoActual.inicio <= ultimoFusionado.fin) {
            // Extender el último rango fusionado si es necesario
            ultimoFusionado.fin = Math.max(ultimoFusionado.fin, rangoActual.fin);
        } else {
            // No hay superposición, agregar como nuevo rango
            rangosFusionados.push(rangoActual);
        }
    }
    
    // Convertir de vuelta a formato de string
    return rangosFusionados.map(r => ({
        horaInicio: formatTime(r.inicio),
        horaFin: formatTime(r.fin)
    }));
}

/**
 * Calcular horarios disponibles dentro de un rango, excluyendo los ocupados
 */
function calcularHorariosDisponibles(horario, agendaOcupada, duracionMinutos, fecha) {
    const horariosDisponibles = [];
    const horaInicio = parseTime(horario.horaInicio);
    const horaFin = parseTime(horario.horaFin);
    
    // Convertir duración a minutos
    const duracionHoras = duracionMinutos / 60;
    
    // Verificar si es hoy para filtrar horarios pasados
    const hoy = new Date();
    const fechaHoyStr = getFechaLocal(hoy);
    const esHoy = fecha === fechaHoyStr;
    
    // Obtener hora actual en formato decimal
    let horaActualDelDia = null;
    if (esHoy) {
        horaActualDelDia = hoy.getHours() + hoy.getMinutes() / 60;
    }
    
    // Convertir todos los horarios ocupados a formato decimal para comparación más eficiente
    const horariosOcupadosDecimales = agendaOcupada.map(ocupado => ({
        inicio: parseTime(ocupado.horaInicio),
        fin: parseTime(ocupado.horaFin)
    }));
    
    // Generar slots de 30 minutos
    let horaActual = horaInicio;
    
    while (horaActual + duracionHoras <= horaFin) {
        const horaFinSlot = horaActual + duracionHoras;
        
        // Si es hoy, saltar slots que ya pasaron o están en curso
        // Un slot debe empezar después de la hora actual para estar disponible
        if (esHoy && horaActual <= horaActualDelDia) {
            horaActual += 0.5;
            continue;
        }
        
        // Verificar si este slot se superpone con algún horario ocupado
        // Dos intervalos se superponen si: inicio1 < fin2 && fin1 > inicio2
        const haySuperposicion = horariosOcupadosDecimales.some(ocupado => {
            // El slot se superpone si:
            // - El inicio del slot es menor que el fin del ocupado Y
            // - El fin del slot es mayor que el inicio del ocupado
            const seSuperpone = horaActual < ocupado.fin && horaFinSlot > ocupado.inicio;
            return seSuperpone;
        });
        
        // Solo agregar si NO hay superposición (está disponible)
        if (!haySuperposicion) {
            horariosDisponibles.push({
                horaInicio: formatTime(horaActual),
                horaFin: formatTime(horaFinSlot),
                disponible: true
            });
        }
        
        // Avanzar 30 minutos
        horaActual += 0.5;
    }
    
    return horariosDisponibles;
}

/**
 * Obtener fecha local en formato YYYY-MM-DD
 */
function getFechaLocal(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Convertir string de tiempo a número decimal
 */
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}

/**
 * Convertir número decimal a string de tiempo
 */
function formatTime(decimalHours) {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Obtener configuración de horarios de un profesional
 * Retorna los horarios definidos en horario_dia para generar slots en el calendario
 */
const getConfiguracionHorarios = async (req, res) => {
    try {
        const { profesionalId } = req.params;
        
        const query = `
            SELECT 
                hd.dia_semana,
                hd.horaInicio,
                hd.horaFin
            FROM horario_profesional hp
            INNER JOIN horario_dia hd ON hp.id = hd.horario_id
            WHERE hp.profesional_id = ?
            AND (hp.fechaFin IS NULL OR hp.fechaFin >= CURDATE())
            ORDER BY 
                CASE hd.dia_semana
                    WHEN 'Lunes' THEN 1
                    WHEN 'Martes' THEN 2
                    WHEN 'Miercoles' THEN 3
                    WHEN 'Jueves' THEN 4
                    WHEN 'Viernes' THEN 5
                    WHEN 'Sabado' THEN 6
                    WHEN 'Domingo' THEN 7
                END,
                hd.horaInicio
        `;
        
        const [rows] = await db.execute(query, [profesionalId]);
        
        // Agrupar horarios por día de la semana
        const horariosPorDia = {};
        rows.forEach(row => {
            if (!horariosPorDia[row.dia_semana]) {
                horariosPorDia[row.dia_semana] = [];
            }
            horariosPorDia[row.dia_semana].push({
                horaInicio: row.horaInicio.substring(0, 5),
                horaFin: row.horaFin.substring(0, 5)
            });
        });
        
        res.json({
            success: true,
            data: horariosPorDia
        });
        
    } catch (error) {
        console.error('Error al obtener configuración de horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getHorariosDisponibles,
    confirmarHorario,
    getConfiguracionHorarios
};
