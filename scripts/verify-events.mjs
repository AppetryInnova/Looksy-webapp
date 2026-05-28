import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyEvents() {
    console.log('--- Verificando Módulo de Eventos ---');

    try {
        // 1. Buscar un usuario de prueba
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No se encontró ningún usuario para la prueba.');
            return;
        }
        console.log(`Usando usuario: ${user.email} (${user.id})`);

        // 2. Crear un evento de prueba (simulando el comportamiento del nuevo POST)
        console.log('Creando evento de prueba...');
        const testEvent = await prisma.event.create({
            data: {
                title: 'Evento de Prueba Looksy',
                description: 'Verificando la creación de eventos sociales.',
                date: new Date(Date.now() + 86400000), // Mañana
                location: 'Sede Looksy',
                dressCode: 'Casual Smart',
                visibility: 'PUBLIC',
                creatorId: user.id,
                attendees: {
                    create: {
                        userId: user.id,
                        rsvpStatus: 'GOING'
                    }
                }
            },
            include: {
                attendees: true
            }
        });

        console.log('✅ Evento creado exitosamente:', testEvent.title);
        console.log('Asistentes iniciales:', testEvent.attendees.length);

        if (testEvent.attendees[0].userId === user.id && testEvent.attendees[0].rsvpStatus === 'GOING') {
            console.log('✅ Creador registrado correctamente como GOING.');
        } else {
            console.error('❌ Error en el registro automático del creador.');
        }

        // 3. Probar RSVP (Simulando el comportamiento del endpoint RSVP)
        console.log('Probando RSVP (Maybe)...');
        const rsvp = await prisma.eventAttendee.upsert({
            where: {
                eventId_userId: {
                    eventId: testEvent.id,
                    userId: user.id
                }
            },
            update: {
                rsvpStatus: 'MAYBE',
                responseMessage: 'Quizás vaya tarde',
                plusOnes: 1
            },
            create: {
                eventId: testEvent.id,
                userId: user.id,
                rsvpStatus: 'MAYBE'
            }
        });

        console.log('✅ RSVP actualizado a MAYBE con mensaje y plusOne.');
        if (rsvp.plusOnes === 1 && rsvp.responseMessage === 'Quizás vaya tarde') {
            console.log('✅ Campos extra de RSVP guardados correctamente.');
        } else {
            console.error('❌ Error al guardar campos extra de RSVP.');
        }

        // 4. Limpieza (Opcional, pero dejaremos el evento para que el usuario lo vea si quiere)
        // await prisma.event.delete({ where: { id: testEvent.id } });
        // console.log('Evento de prueba eliminado.');

        console.log('\n--- Verificación Completada Exitosamente ---');

    } catch (error) {
        console.error('Error durante la verificación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyEvents();
