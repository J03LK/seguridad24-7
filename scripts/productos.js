// productos.js - Modificado para redirigir a páginas de éxito y error

const $d = document;
const $productsCar = $d.getElementById("productsCar");
const $template = $d.getElementById("product-card-template").content;
const $fragment = $d.createDocumentFragment();
const options = {
  headers: {
    Authorization: `Bearer ${keys.secret}`
  }
};

// Función para formatear el precio en formato moneda
const FormatoMoneda = num => `$ ${num.slice(0, -2)}.${num.slice(-2)}`;

let products, prices;

// Verificar si estamos en la página de paquetes
const isPackagePage = $d.querySelector('.paquete') !== null;

// Cargar los productos desde Stripe
Promise.all([
  fetch("", options),
  fetch("", options)
])
.then(responses => Promise.all(responses.map(res => res.json())))
.then(json => {
  products = json[0].data;
  prices = json[1].data;
  
  // Crear tarjetas de productos para la sección del carrito
  prices.forEach(el => {
    let productData = products.filter(product => product.id === el.product);
    
    if(productData.length > 0) {
      const productFigure = $template.querySelector(".products-seguridad");
      
      // Guardar ID de precio como atributo data
      productFigure.setAttribute("data-price", el.id);
      
      // También guardamos el tipo de producto para identificarlo
      const productName = productData[0].name.toLowerCase();
      if (productName.includes('básico') || productName.includes('basico')) {
        productFigure.setAttribute("data-type", "basic");
      } else if (productName.includes('premium')) {
        productFigure.setAttribute("data-type", "premium");
      } else {
        productFigure.setAttribute("data-type", "regular");
      }
      
      // Configurar imagen
      const productImg = $template.querySelector("img");
      productImg.src = productData[0].images[0] || "assets/default-product.jpg";
      productImg.alt = productData[0].name;
      
      // Actualizar el contenido - en página de paquetes sin botón, en otras con botón
      if (isPackagePage) {
        // En página de paquetes: sin botón de agregar al carrito
        $template.querySelector("figcaption").innerHTML = `
          <div>${productData[0].name}</div>
          <div class="product-price">${FormatoMoneda(el.unit_amount_decimal)} ${(el.currency).toUpperCase()}</div>
        `;
      } else {
        // En otras páginas: con botón de agregar al carrito
        $template.querySelector("figcaption").innerHTML = `
          <div>${productData[0].name}</div>
          <div class="product-price">${FormatoMoneda(el.unit_amount_decimal)} ${(el.currency).toUpperCase()}</div>
          <button class="btn-agregar-carrito" data-price="${el.id}">Agregar al carrito</button>
        `;
      }
      
      let $clone = $d.importNode($template, true);
      $fragment.appendChild($clone);
    }
  });
  
  if ($productsCar) {
    $productsCar.appendChild($fragment);
  
    // Configurar eventos para los productos
    setupProductEvents();
  }
})
.catch(error => {
  let message = error.statusText || "Ocurrió un error en la petición";
  if ($productsCar) {
    $productsCar.innerHTML = `Error: ${error.status || ''}: ${message}`;
  }
  console.error("Error al cargar productos:", error);
});

// Función para configurar eventos en productos
function setupProductEvents() {
  // 1. Añadir evento para hacer click en cualquier parte del producto
  $d.querySelectorAll(".products-seguridad").forEach(product => {
    product.style.cursor = "pointer"; // Hacer visualmente clickeable
    
    product.addEventListener("click", function(e) {
      // Si el click no fue en el botón de agregar carrito, redirigir a página de carrito
      if (!e.target.matches(".btn-agregar-carrito")) {
        e.preventDefault();
        addToCartAndRedirect(this);
      }
    });
  });
  
  // 2. Configurar los botones de "Agregar al carrito" (solo si no estamos en página de paquetes)
  if (!isPackagePage) {
    $d.querySelectorAll(".btn-agregar-carrito").forEach(button => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation(); // Evita que el click se propague al contenedor
        
        // Obtener producto contenedor
        const productContainer = this.closest(".products-seguridad");
        
        // Añadir al carrito y mostrar toast de confirmación
        addToCartAndShowToast(productContainer);
      });
    });
  }
}

// Función para redirigir a la página del carrito
function addToCartAndRedirect(productElement) {
  // Obtener datos del producto
  const priceId = productElement.getAttribute("data-price");
  const productType = productElement.getAttribute("data-type");
  const productName = productElement.querySelector("figcaption div:first-child").textContent;
  const productPrice = productElement.querySelector(".product-price").textContent;
  const productImage = productElement.querySelector("img").src;
  
  // Guardar en localStorage para recuperarlo en la página del carrito
  const productData = {
    id: priceId,
    type: productType,
    name: productName,
    price: productPrice.replace(/[^0-9.]/g, ''), // Limpiar para dejar solo números
    image: productImage,
    quantity: 1
  };
  
  // Guardar en localStorage
  localStorage.setItem("selectedProduct", JSON.stringify(productData));
  
  // Redirigir a la página del carrito
  window.location.href = "Carrito.html";
}

// Función para mostrar el toast de confirmación
function addToCartAndShowToast(productElement) {
  // Obtener datos del producto
  const productName = productElement.querySelector("figcaption div:first-child").textContent;
  const productPrice = productElement.querySelector(".product-price").textContent;
  const productImage = productElement.querySelector("img").src;
  
  // Mostrar toast con animación
  const toast = $d.getElementById("cart-toast");
  const toastImg = $d.getElementById("cart-toast-img");
  const toastName = $d.getElementById("cart-toast-name");
  const toastPrice = $d.getElementById("cart-toast-price");
  
  if (toast && toastImg && toastName && toastPrice) {
    toastImg.src = productImage;
    toastName.textContent = productName;
    toastPrice.textContent = productPrice;
    
    toast.style.display = "flex";
    
    // Animar entrada
    toast.style.animation = "fadeIn 0.3s ease";
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => {
        toast.style.display = "none";
      }, 300);
    }, 3000);
  }
  
  // Actualizar contador del carrito
  updateCartCount(1);
}

// Función para actualizar contador del carrito
function updateCartCount(increment) {
  const cartCount = $d.getElementById("cart-count");
  
  if (cartCount) {
    // Obtener valor actual y convertir a número
    let currentCount = parseInt(cartCount.textContent || "0");
    
    // Incrementar
    currentCount += increment;
    
    // Actualizar DOM
    cartCount.textContent = currentCount;
    
    // Si hay algún contador en localStorage, actualizarlo también
    let storedCount = localStorage.getItem("cartCount");
    if (storedCount !== null) {
      localStorage.setItem("cartCount", parseInt(storedCount) + increment);
    } else {
      localStorage.setItem("cartCount", increment);
    }
  }
}
// Función para procesar el pago con Stripe (modo payment)
function procesarPagoStripe(priceId, quantity = 1) {
  // Clave pública de Stripe
  const stripeKey = keys.public;
  
  try {
    const stripe = Stripe(stripeKey);
    
    // Configurar URL base para redirección
    const baseUrl = window.location.origin;
    
    // Redireccionar a Stripe Checkout
    stripe.redirectToCheckout({
      lineItems: [{
        price: priceId, 
        quantity: quantity 
      }],
      mode: "payment", // Modo de pago único en lugar de suscripción
      // URLs absolutas para las páginas de éxito y cancelación
      successUrl: baseUrl + "/assets/success.html",
      cancelUrl: baseUrl + "/assets/cancel.html",
    })
    .then(result => {
      if (result.error) {
        console.error("Error en Stripe:", result.error.message);
        // Redirigir a la página de error si hay un problema
        window.location.href = baseUrl + "/assets/error-pago.html";
      }
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    // Redirigir a la página de error si hay una excepción
    window.location.href = baseUrl + "/assets/error-pago.html";
  }
}



