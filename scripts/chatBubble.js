/**
 * Script para manejar la burbuja de chat del asistente virtual
 */
document.addEventListener('DOMContentLoaded', function () {
    // Elementos existentes del chat
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const container = document.getElementById('asistente-virtual-container');
    
    // Buscar la burbuja existente (en caso de que ya esté en el DOM)
    let chatBubble = document.getElementById('chat-bubble');
    
    // Si no existe, crearla dinámicamente
    if (!chatBubble) {
        chatBubble = document.createElement('div');
        chatBubble.id = 'chat-bubble';
        chatBubble.className = 'chat-bubble';
        chatBubble.innerHTML = '<p>¿Necesitas ayuda con seguridad?</p><div class="chat-bubble-arrow"></div>';
        
        // Insertar la burbuja antes del botón de chat
        if (container && chatButton) {
            container.insertBefore(chatBubble, chatButton);
        }
    }
    
    // Variable para controlar si la burbuja está visible
    let bubbleVisible = true;
    
    // Función para ocultar la burbuja
    function hideBubble() {
        if (chatBubble) {
            chatBubble.style.opacity = '0';
            chatBubble.style.visibility = 'hidden';
            bubbleVisible = false;
        }
    }
    
    // Función para mostrar la burbuja
    function showBubble() {
        if (chatBubble) {
            chatBubble.style.opacity = '1';
            chatBubble.style.visibility = 'visible';
            bubbleVisible = true;
        }
    }
    
    // Función para abrir el chat
    function openChat() {
        if (chatWindow) {
            chatWindow.classList.remove('hidden');
            hideBubble();
        }
    }
    
    // Función para cerrar el chat
    function closeChat() {
        if (chatWindow) {
            chatWindow.classList.add('hidden');
            // La burbuja se mostrará a través del ciclo
        }
    }
    
    // Verificar si el chat está abierto
    function isChatOpen() {
        return chatWindow && !chatWindow.classList.contains('hidden');
    }
    
    // Si el chat está abierto al cargar la página, ocultar la burbuja
    if (isChatOpen()) {
        hideBubble();
    } else {
        showBubble();
    }
    
    // Hacer que la burbuja sea clickeable para abrir el chat
    if (chatBubble) {
        chatBubble.addEventListener('click', function() {
            openChat();
        });
    }
    
    // IMPORTANTE: Asegurarse de que el botón del chat funcione correctamente
    if (chatButton) {
        // Eliminar cualquier evento existente (para evitar duplicados)
        chatButton.replaceWith(chatButton.cloneNode(true));
        
        // Obtener la referencia actualizada
        const newChatButton = document.getElementById('chat-button');
        
        // Añadir el nuevo listener
        newChatButton.addEventListener('click', function() {
            if (isChatOpen()) {
                closeChat();
            } else {
                openChat();
            }
        });
    }
    
    // Buscar el botón de cerrar chat
    const closeChatButton = document.getElementById('close-chat');
    if (closeChatButton) {
        // Eliminar cualquier evento existente
        closeChatButton.replaceWith(closeChatButton.cloneNode(true));
        
        // Obtener la referencia actualizada
        const newCloseChatButton = document.getElementById('close-chat');
        
        // Añadir el nuevo listener
        newCloseChatButton.addEventListener('click', function() {
            closeChat();
            // Mostrar la burbuja después de un breve retraso
            setTimeout(bubbleCycle, 1000);
        });
    }
    
    // Ciclo para mostrar/ocultar la burbuja
    function bubbleCycle() {
        if (!isChatOpen() && !bubbleVisible) {
            showBubble();
            
            // Ocultar después de 10 segundos si el chat sigue cerrado
            setTimeout(() => {
                if (!isChatOpen()) {
                    hideBubble();
                    
                    // Mostrar nuevamente después de 30 segundos
                    setTimeout(() => {
                        if (!isChatOpen()) {
                            bubbleCycle(); // Repetir el ciclo
                        }
                    }, 30000);
                }
            }, 10000);
        }
    }
    
    // Iniciar el ciclo
    bubbleCycle();
    
    // Log para depuración
    console.log('ChatBubble script loaded successfully');
});