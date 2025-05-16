document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');

    // Generar un ID de sesión único
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Mostrar/ocultar ventana de chat
    chatButton.addEventListener('click', function () {
        chatWindow.classList.toggle('hidden');
    });

    closeChat.addEventListener('click', function () {
        chatWindow.classList.add('hidden');
    });

    // Función para enviar mensajes
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Añadir mensaje del usuario a la conversación
        addMessage(message, 'user');
        userInput.value = '';

        // Mostrar indicador de escritura
        showTypingIndicator();

        // Llamar a la API de OpenAI a través del backend
        callOpenAIAPI(message)
            .then(response => {
                hideTypingIndicator();
                
                // Verifica si la respuesta menciona años de experiencia incorrectos
                let correctedResponse = corregirAniosExperiencia(response);
                addMessage(correctedResponse, 'bot');
            })
            .catch(error => {
                hideTypingIndicator();
                addMessage('Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.', 'bot');
                console.error('Error:', error);
            });
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
            // Otros patrones
            {
                regex: /(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años\s+en\s+el\s+(mercado|sector)/gi,
                reemplazo: '19 años en el $2'
            },
            {
                regex: /(\d+|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|[a-zA-Z]+)\s+años\s+brindando/gi,
                reemplazo: '19 años brindando'
            }
        ];

        // Aplica las correcciones
        let textoCorregido = texto;
        patrones.forEach(patron => {
            textoCorregido = textoCorregido.replace(patron.regex, patron.reemplazo);
        });

        return textoCorregido;
    }

    // Función para formatear números de teléfono en el texto
    function formatPhoneNumbers(text) {
        // Patrón para detectar números de teléfono ecuatorianos (09XXXXXXXX o similar)
        const phonePattern = /(\b(?:0[9|8]\d{8}|0[9|8]\d{1}\s?\d{3}\s?\d{4})\b)/g;
        
        // Reemplazar números de teléfono con versión formateada y clickeable
        return text.replace(phonePattern, '<strong class="phone-number">$1</strong>');
    }

    // Función para añadir mensaje a la ventana de chat con formateo especial
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        // Si es un mensaje del bot, aplicar formateo especial
        if (sender === 'bot') {
            // Formatear números de teléfono/WhatsApp
            const formattedContent = formatPhoneNumbers(content);
            messageDiv.innerHTML = formattedContent;
        } else {
            // Para mensajes del usuario, mantener texto normal
            messageDiv.textContent = content;
        }
        
        chatMessages.appendChild(messageDiv);

        // Scroll automático hacia abajo
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Mostrar indicador de "escribiendo..."
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-indicator');
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        typingDiv.id = 'typing-indicator';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Ocultar indicador de "escribiendo..."
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Función para llamar a la API de OpenAI
    async function callOpenAIAPI(message) {
        try {
            const response = await fetch('http://localhost:3000/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: message,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error al llamar a la API:', error);
            throw error;
        }
    }

    // Añadir event listener para detectar clics en números de teléfono
    chatMessages.addEventListener('click', function(event) {
        // Verificar si el clic fue en un número de teléfono
        if (event.target.classList.contains('phone-number')) {
            const phoneNumber = event.target.textContent.replace(/\s+/g, ''); // Eliminar espacios
            // Abrir WhatsApp
            window.open(`https://wa.me/593${phoneNumber.substring(1)}`, '_blank');
        }
    });

    // Enviar mensaje al presionar Enter
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);
});