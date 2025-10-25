// controllers/horarioController.js
const horarioModel = require('../models/horarioProfesionalModel');
const db = require('../config/db');

/**
 * Obtener horarios disponibles de un profesional para una semana específica
 */
const getHorariosDisponibles = async (req, res) => {
    try {
        const { profesionalId } = req.params;
        const { fechaInicio, duracion } = req.query;
        
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
            fechaFin.toISOString().split('T')[0]
        );

        // Procesar horarios disponibles
        console.log('[DEBUG] Procesando horarios disponibles...');
        const horariosDisponibles = procesarHorariosDisponibles(
            horariosActivos,
            agendaOcupada,
            fechaInicio,
            parseInt(duracion)
        );
        console.log('[DEBUG] Horarios procesados:', JSON.stringify(horariosDisponibles, null, 2));

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
 * Confirmar horario seleccionado y crear entrada en agenda
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

        // Obtener información del presupuesto
        const presupuestoQuery = `
            SELECT 
                p.id,
                p.solicitud_id,
                p.profesional_persona_id,
                p.duracion,
                p.estado
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

        // Obtener ID del profesional
        const profesionalQuery = `
            SELECT prof.id as profesional_id
            FROM profesional prof
            WHERE prof.id = ?
        `;
        
        const [profesionalRows] = await db.execute(profesionalQuery, [presupuesto.profesional_persona_id]);
        
        if (profesionalRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }

        const profesionalId = profesionalRows[0].profesional_id;

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

        // Iniciar transacción
        await db.execute('START TRANSACTION');

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

            // Confirmar transacción
            await db.execute('COMMIT');

            res.json({
                success: true,
                message: 'Horario confirmado exitosamente',
                data: {
                    agendaId,
                    presupuestoId,
                    fecha,
                    horaInicio,
                    horaFin
                }
            });

        } catch (error) {
            await db.execute('ROLLBACK');
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
        if (!agendaPorFecha[entrada.fecha]) {
            agendaPorFecha[entrada.fecha] = [];
        }
        agendaPorFecha[entrada.fecha].push({
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
                    const horariosDisponibles = calcularHorariosDisponibles(
                        horario,
                        agendaPorFecha[fecha] || [],
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
    
    console.log(`[DEBUG] Comparando fechas - fecha slot: ${fecha}, hoy: ${fechaHoyStr}, esHoy: ${esHoy}`);
    console.log(`[DEBUG] Fecha completa hoy:`, hoy.toString());
    
    // Obtener hora actual en formato decimal
    let horaActualDelDia = null;
    if (esHoy) {
        horaActualDelDia = hoy.getHours() + hoy.getMinutes() / 60;
        console.log(`[DEBUG] Es hoy (${fecha}). Hora actual: ${horaActualDelDia.toFixed(2)} (${hoy.getHours()}:${hoy.getMinutes()})`);
    }
    
    // Generar slots de 30 minutos
    let horaActual = horaInicio;
    
    while (horaActual + duracionHoras <= horaFin) {
        const horaFinSlot = horaActual + duracionHoras;
        
        // Si es hoy, saltar slots que ya pasaron o están en curso
        // Un slot debe empezar después de la hora actual para estar disponible
        if (esHoy && horaActual <= horaActualDelDia) {
            console.log(`[DEBUG] Saltando slot ${formatTime(horaActual)}-${formatTime(horaFinSlot)} (ya pasó)`);
            horaActual += 0.5;
            continue;
        }
        
        // Verificar si este slot está disponible
        const estaDisponible = agendaOcupada.every(ocupado => {
            const ocupadoInicio = parseTime(ocupado.horaInicio);
            const ocupadoFin = parseTime(ocupado.horaFin);
            
            return !(horaActual < ocupadoFin && horaFinSlot > ocupadoInicio);
        });
        
        if (estaDisponible) {
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

module.exports = {
    getHorariosDisponibles,
    confirmarHorario
};
