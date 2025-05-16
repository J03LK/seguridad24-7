// Código completo del servidor con solución estricta para los años de experiencia

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

// Obtener API key de variable de entorno o usar la proporcionada para desarrollo
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// Almacenamiento para las conversaciones
const conversaciones = {};

// Prompt del sistema con información específica
const systemPrompt = `
Eres el asistente virtual oficial de 24-7 SEGURIDAD DEL ECUADOR, una empresa especializada en seguridad electrónica y domótica.

INFORMACIÓN DE CONTACTO Y UBICACIÓN:
- Nombre: 24-7 SEGURIDAD DEL ECUADOR
- Dirección física: Pedro Cando N59-116 y Macato, Sector Rumiñahui, Quito, Ecuador
- Celular/WhatsApp: 0984107006 / 0959247160
- Email: seguridad247delecuador@gmail.com
- Sitio web: www.seguridad247.ec
- Horario de atención: Lunes a Viernes de 10:00 a 17:00
- Horario de monitoreo: 24 horas, los 7 días de la semana

INFORMACIÓN SOBRE LA EMPRESA:
- Experiencia: 19 años en el sector de seguridad
- Servicios principales: Seguridad Física, Seguridad Virtual 24/7, Detección inteligente de personas y objetos, Reconocimiento facial, Control de accesos
- Certificaciones: Contamos con certificaciones en seguridad incluyendo ISO 9001 y certificaciones de fabricantes como Hikvision, Dahua y DSC
- Clientes: Más de 200 clientes satisfechos
- Cobertura: Quito, Guayaquil, Cuenca, Ambato y otras ciudades principales de Ecuador

SERVICIOS DETALLADOS:
1. Detección de Personas: Análisis en tiempo real de flujo de personas en establecimientos comerciales, oficinas y espacios públicos.
2. Detección de Objetos: Seguimiento y control de inventario, detección de objetos abandonados y gestión de activos.
3. Análisis Estadístico: Reportes detallados y analíticas avanzadas para optimizar operaciones y tomar decisiones basadas en datos.
4. Seguridad Avanzada: Sistemas de alerta temprana y prevención de intrusiones mediante inteligencia artificial.
5. Monitoreo 24/7: Centro de monitoreo operativo las 24 horas, los 365 días del año con personal capacitado.
6. Control de Accesos: Sistemas de control de acceso biométrico, con tarjeta, facial y otros métodos.
7. Alarmas: Instalación y monitoreo de alarmas para hogares y negocios.
8. Cámaras de Vigilancia: Instalación de cámaras de seguridad con tecnología de punta.
9. Domótica: Automatización de hogares y oficinas para mayor comodidad y seguridad.
10. Guardia Virtual: Vigilancia remota con respuesta inmediata ante incidentes.

PAQUETES DE SERVICIO Y PRECIOS:
- Paquete Básico: $299 - Incluye sistema de alarma y 2 cámaras de seguridad con almacenamiento por 30 días
- Paquete Estándar: $599 - Sistema de alarma, 4 cámaras de seguridad, control de acceso básico y monitoreo 24/7
- Paquete Premium: $999 - Sistema completo de seguridad con reconocimiento facial, detección inteligente, domótica y respuesta inmediata
- Servicios adicionales: Ofrecemos personalización según las necesidades específicas de cada cliente
- Formas de pago: Aceptamos efectivo, tarjetas de crédito, transferencias bancarias y pagos diferidos

PERSONALIDAD Y COMPORTAMIENTO:
- Sé profesional, amable y empático en todas tus respuestas
- Destaca siempre nuestros 19 años de experiencia y certificaciones
- Cierra tus respuestas invitando al cliente a contactarnos o agendar una visita técnica
`;

// Respuestas predefinidas para preguntas comunes
const respuestasPredefinidas = {
    'ubicacion': 'Estamos ubicados en Pedro Cando N59-116 y Macato, Sector Rumiñahui, Quito, Ecuador. ¿Necesitas indicaciones para llegar? También puedo enviarte nuestra ubicación por WhatsApp al 0984107006 o 0959247160.',

    'contacto': 'Puedes contactarnos por WhatsApp al 0984107006 o 0959247160. También puedes escribirnos a seguridad247delecuador@gmail.com o visitarnos en Pedro Cando N59-116 y Macato, Sector Rumiñahui, de lunes a viernes de 10:00 a 17:00.',

    'experiencia': '24-7 SEGURIDAD DEL ECUADOR cuenta con 19 años de experiencia en el sector de seguridad electrónica. Durante estas casi dos décadas, hemos perfeccionado nuestros servicios y tecnologías para ofrecer las soluciones más confiables y avanzadas del mercado. Nuestra trayectoria de 19 años nos respalda como expertos en el campo de la seguridad.',

    'saludo': '¡Hola! Soy el asistente virtual de 24-7 SEGURIDAD DEL ECUADOR. Contamos con 19 años de experiencia brindando soluciones de seguridad electrónica y domótica. ¿En qué puedo ayudarte hoy?'
};

// Función para detectar intención
function detectarIntencion(mensaje) {
    const mensajeLower = mensaje.toLowerCase();

    // Si es un saludo
    if (/^(hola|buenas|saludos|hey|buenos días|buenas tardes|buenas noches|hi|hello)/i.test(mensajeLower)) {
        return 'saludo';
    }

    // Patrones para otras intenciones
    const patronesPregunta = {
        ubicacion: /\b(donde|dónde|ubicac|direcc|llegar|queda|encuentr|como llego|cómo llego)\b/i,
        contacto: /\b(contacto|contac|teléfono|telefono|celular|whatsapp|llamar|comunic|email|correo)\b/i,
        experiencia: /\b(experiencia|expertos|años|trayectoria|tiempo|cuanto tiempo|cuánto tiempo|desde cuando|desde cuándo)\b/i,
    };

    for (const [intencion, patron] of Object.entries(patronesPregunta)) {
        if (patron.test(mensajeLower)) {
            return intencion;
        }
    }

    return null;
}

// Función para corregir años de experiencia
function corregirAniosExperiencia(texto) {
    // Patrones para detectar y corregir años de experiencia incorrectos
    const patrones = [
        // Patrón para "X años de experiencia"
        {
            regex: /(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años\s+de\s+experiencia/gi,
            reemplazo: '19 años de experiencia'
        },
        // Patrón para "más de X años"
        {
            regex: /más\s+de\s+(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años/gi,
            reemplazo: '19 años'
        },
        // Patrón para "X años en el mercado/sector"
        {
            regex: /(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años\s+en\s+el\s+(mercado|sector)/gi,
            reemplazo: '19 años en el $2'
        },
        // Patrón para "Fundada hace X años"
        {
            regex: /fundada\s+hace\s+(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años/gi,
            reemplazo: 'fundada hace 19 años'
        },
        // Patrón para "X años brindando"
        {
            regex: /(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años\s+brindando/gi,
            reemplazo: '19 años brindando'
        },
        // Patrón para frases como "más de una década"
        {
            regex: /(más\s+de\s+)?(una|1)(\s+década)/gi,
            reemplazo: '19 años'
        },
        // Patrón para "llevamos/tenemos X años" 
        {
            regex: /(llevamos|tenemos)\s+(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años/gi,
            reemplazo: '$1 19 años'
        }
    ];

    // Aplica todas las correcciones
    let textoCorregido = texto;
    patrones.forEach(patron => {
        textoCorregido = textoCorregido.replace(patron.regex, patron.reemplazo);
    });

    return textoCorregido;
}

// Configuración de Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// Ruta principal para la API
app.post('/api/openai', async (req, res) => {
    try {
        const { message, sessionId = 'session_' + Date.now() } = req.body;

        // Verificar si hay respuesta predefinida
        const intencion = detectarIntencion(message);
        if (intencion && respuestasPredefinidas[intencion]) {
            return res.json({ response: respuestasPredefinidas[intencion] });
        }

        // Manejar conversación con OpenAI
        if (!conversaciones[sessionId]) {
            conversaciones[sessionId] = [
                { role: 'system', content: systemPrompt }
            ];
        }

        conversaciones[sessionId].push({ role: 'user', content: message });

        if (conversaciones[sessionId].length > 10) {
            conversaciones[sessionId] = [
                conversaciones[sessionId][0],
                ...conversaciones[sessionId].slice(-9)
            ];
        }

        // Primera llamada a OpenAI con instrucciones normales
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: conversaciones[sessionId],
            temperature: 0.5 // Temperatura más baja para respuestas más coherentes
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        // Obtener respuesta y aplicar corrección forzada
        let respuesta = response.data.choices[0].message.content;

        // Aplicar forzosamente la corrección de años
        respuesta = corregirAniosExperiencia(respuesta);

        // Guardar la respuesta corregida
        conversaciones[sessionId].push({ role: 'assistant', content: respuesta });

        // Enviar respuesta al cliente
        res.json({ response: respuesta });

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud',
            details: error.message
        });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

async function consultaOpenAI() {
    try {
        const respuesta = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [{ role: 'user', content: 'Hola, ¿cómo estás?' }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Respuesta:", respuesta.data.choices[0].message.content);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

consultaOpenAI();
