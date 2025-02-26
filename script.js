// script.js
// Copyright @cloverdigital.arg 2025
// Este archivo contiene las funcionalidades JavaScript para la interactividad del sitio web de Looki Bar,
// incluyendo manejo de la pantalla de bienvenida, carga de productos desde Google Sheets, gestión del
// carrito, modales de personalización, y envío de pedidos por WhatsApp.

// Espera a que el DOM esté completamente cargado para ejecutar las funciones
document.addEventListener("DOMContentLoaded", async function () {
    // Elementos de la pantalla de bienvenida y contenido principal
    const welcomeScreen = document.getElementById("welcome-screen"); // Pantalla inicial
    const appContent = document.getElementById("app-content"); // Contenido principal de la app
    const enterBtn = document.getElementById("enter-btn"); // Botón para ingresar desde la pantalla de bienvenida

    // Elementos relacionados con la app y el manejo de productos/carrito
    const SHEET_URL = "https://opensheet.elk.sh/1oVfG1dhrkutkOWe7hELdONDnQyRTtSYITpoYHvpTZLQ/menu"; // URL de la hoja de cálculo de Google Sheets
    const categoriasContainer = document.getElementById("categorias-container"); // Contenedor del acordeón de categorías
    const listaCarrito = document.getElementById("listaCarrito"); // Lista de productos en el carrito (modal)
    const totalPedido = document.getElementById("totalPedido"); // Total del pedido en el modal del carrito
    const fixedTotal = document.getElementById("fixedTotal"); // Total fijo en el botón del carrito
    const verCarrito = document.getElementById("verCarrito"); // Botón fijo para abrir el carrito
    const enviarPedido = document.getElementById("enviarPedido"); // Botón para enviar el pedido por WhatsApp
    const footer = document.querySelector("footer"); // Elemento footer para ajustes dinámicos

    // Instancias de modales de Bootstrap para productos, personalización, carrito y confirmación
    const productoModal = new bootstrap.Modal(document.getElementById("popup")); // Modal para detalles del producto
    const personalizarModal = new bootstrap.Modal(document.getElementById("personalizar")); // Modal para personalizar pedidos
    const carritoModal = new bootstrap.Modal(document.getElementById("carrito")); // Modal del carrito
    const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal")); // Modal de confirmación

    // Elementos dentro de los modales
    const popupTitulo = document.getElementById("popupTitulo"); // Título del producto en el modal
    const popupImagen = document.getElementById("popupImagen"); // Imagen del producto en el modal
    const popupDescripcion = document.getElementById("popupDescripcion"); // Descripción del producto en el modal
    const popupPrecio = document.getElementById("popupPrecio"); // Precio del producto en el modal
    const btnProceder = document.getElementById("btnProceder"); // Botón para proceder a personalizar en el modal de producto

    const cantidadInput = document.getElementById("cantidadInput"); // Input para la cantidad en el modal de personalización
    const comentarioInput = document.getElementById("comentarioInput"); // Texarea para comentarios en el modal de personalización
    const btnConfirmar = document.getElementById("btnConfirmar"); // Botón para confirmar personalización

    // Variables globales para gestionar el carrito y el tipo de envío
    let carrito = JSON.parse(localStorage.getItem("carrito")) || []; // Carrito inicial desde localStorage o vacío
    let productoActual = {}; // Almacena el producto actual en el modal
    let tipoEnvio = ""; // Tipo de envío seleccionado (Delivery o Takeaway)

    // Asegurarse de que la pantalla de bienvenida esté visible y la app oculta al inicio
    welcomeScreen.classList.remove("hidden"); // Muestra la pantalla de bienvenida
    appContent.classList.add("hidden"); // Oculta el contenido principal

    // Evento para el botón "Ingresar" que inicia la app y carga los productos
    enterBtn.addEventListener("click", function () {
        console.log("Botón Ingresar clickeado"); // Log para depuración
        welcomeScreen.classList.add("hidden"); // Oculta la pantalla de bienvenida
        appContent.classList.remove("hidden"); // Muestra el contenido principal

        // Mostrar el spinner y cargar productos automáticamente
        const loadingSpinner = document.getElementById("loading-spinner");
        loadingSpinner.style.display = "flex"; // Mostrar spinner de carga
        cargarProductos()
            .then(() => {
                console.log("Productos cargados exitosamente"); // Log para depuración
                loadingSpinner.style.display = "none"; // Ocultar spinner al completar
            })
            .catch((error) => {
                console.error("Error al cargar productos:", error); // Log de error
                loadingSpinner.style.display = "none"; // Ocultar spinner en caso de error
                alert("Hubo un error al cargar los productos."); // Notificación al usuario
            });
    });

    // Función debounce para limitar la frecuencia de ejecución de funciones (evita sobrecarga)
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout); // Limpia cualquier timeout previo
            timeout = setTimeout(() => func.apply(this, args), wait); // Ejecuta la función después de wait ms
        };
    }

    // Función para ajustar dinámicamente la posición del carrito según la posición del footer
    function ajustarCarrito() {
        const footerHeight = footer.offsetHeight; // Altura del footer
        const windowHeight = window.innerHeight; // Altura de la ventana
        const documentHeight = document.documentElement.scrollHeight; // Altura total del documento
        const currentScroll = window.pageYOffset; // Posición actual del scroll

        // Si el usuario está cerca del final del documento (footer visible), fijo el footer y ajusto el carrito
        if (currentScroll + windowHeight >= documentHeight - footerHeight) {
            footer.classList.add("fixed"); // Fija el footer en su posición
            // Ajusta el carrito para que esté justo encima del footer fijo
            verCarrito.style.transform = `translateY(-${footerHeight}px)`;
        } else {
            footer.classList.remove("fixed"); // Devuelve el footer a su posición normal
            // Restaura la posición original del carrito
            verCarrito.style.transform = "translateY(0)";
        }
    }

    // Escucha eventos de scroll y redimensiones para ajustar el carrito dinámicamente
    window.addEventListener("scroll", debounce(ajustarCarrito, 100)); // Ajusta al hacer scroll
    window.addEventListener("resize", debounce(ajustarCarrito, 100)); // Ajusta al redimensionar la ventana

    // Llama a la función al cargar para inicializar la posición del carrito
    ajustarCarrito();

    // Función asíncrona para cargar los productos desde Google Sheets
    async function cargarProductos() {
        const loadingSpinner = document.getElementById("loading-spinner"); // Spinner de carga
        try {
            console.log("Intentando cargar productos desde:", SHEET_URL); // Log para depuración
            loadingSpinner.style.display = "flex"; // Muestra el spinner mientras carga
            const response = await fetch(SHEET_URL); // Realiza la solicitud a la API
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`); // Lanza error si la respuesta no es OK
            }
            const data = await response.json(); // Convierte la respuesta a JSON
            console.log("Datos recibidos:", data); // Log de los datos recibidos

            categoriasContainer.innerHTML = ""; // Limpia el contenedor de categorías

            // Organiza los productos por categorías
            const categorias = {};
            data.forEach(producto => {
                console.log("Procesando producto:", producto); // Log para depuración
                if (producto.Activo === "SI") { // Filtra productos activos (ajusta según el valor real)
                    const categoria = producto.Categoría || "Sin categoría"; // Usa la categoría o "Sin categoría" si no hay
                    if (!categorias[categoria]) {
                        categorias[categoria] = []; // Inicializa un array para la categoría si no existe
                    }
                    categorias[categoria].push(producto); // Agrega el producto a su categoría
                }
            });

            // Si no hay productos, muestra un mensaje de error
            if (Object.keys(categorias).length === 0) {
                categoriasContainer.innerHTML = '<p class="text-danger">No hay productos disponibles.</p>';
                loadingSpinner.style.display = "none"; // Oculta el spinner
                return;
            }

            // Crea los elementos del acordeón para cada categoría
            Object.keys(categorias).forEach((categoria, index) => {
                const accordionItem = document.createElement("div");
                accordionItem.className = "accordion-item";
                accordionItem.innerHTML = `
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="collapse${index}">
                            ${categoria}
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${index}" data-bs-parent="#categorias-container">
                        <div class="accordion-body"></div>
                    </div>
                `;
                const accordionBody = accordionItem.querySelector(".accordion-body");

                // Agrega cada producto dentro de su categoría correspondiente
                categorias[categoria].forEach(producto => {
                    const div = document.createElement("div");
                    div.className = "producto d-flex align-items-center p-3 border rounded mb-3";
                    div.innerHTML = `
                        <img src="${producto.Imagen || 'https://via.placeholder.com/80'}" class="img-fluid me-3 rounded" style="width: 80px;">
                        <div>
                            <h5>${producto.Nombre}</h5>
                            <p class="text-muted">${producto.Descripción}</p>
                        </div>
                        <strong class="ms-auto">$${parseFloat(producto.Precio || 0).toFixed(2)}</strong>
                    `;
                    div.addEventListener("click", () => abrirModalProducto(producto)); // Evento para abrir el modal del producto
                    accordionBody.appendChild(div);
                });

                categoriasContainer.appendChild(accordionItem); // Agrega el item del acordeón al contenedor
            });
            loadingSpinner.style.display = "none"; // Oculta el spinner al completar la carga
        } catch (error) {
            console.error("Error al cargar productos:", error); // Log de error detallado
            categoriasContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
            loadingSpinner.style.display = "none"; // Oculta el spinner en caso de error
        }
    }

    // Función para abrir el modal del producto con los detalles
    function abrirModalProducto(producto) {
        productoActual = { ...producto, cantidad: 1, comentario: "" }; // Resetea el producto actual con cantidad y comentario
        popupTitulo.textContent = producto.Nombre; // Establece el título del modal
        popupImagen.src = producto.Imagen || 'https://via.placeholder.com/150'; // Establece la imagen del producto
        popupDescripcion.textContent = producto.Descripción; // Establece la descripción
        popupPrecio.textContent = `$${parseFloat(producto.Precio || 0).toFixed(2)}`; // Establece el precio
        cantidadInput.value = 1; // Resetea la cantidad a 1
        comentarioInput.value = ""; // Limpia cualquier comentario previo
        productoModal.show(); // Muestra el modal del producto
    }

    // Evento para el botón "Agregar" en el modal de producto, que abre el modal de personalización
    btnProceder.addEventListener("click", function () {
        productoModal.hide(); // Cierra el modal del producto
        personalizarModal.show(); // Abre el modal de personalización
    });

    // Evento para incrementar la cantidad en el modal de personalización
    document.getElementById("btnIncrementar").addEventListener("click", () => cantidadInput.value++);

    // Evento para decrementar la cantidad, asegurando que no baje de 1
    document.getElementById("btnDecrementar").addEventListener("click", () => cantidadInput.value = Math.max(1, cantidadInput.value - 1));

    // Evento para validar que la cantidad no sea menor a 1 al escribir manualmente
    cantidadInput.addEventListener("input", () => {
        if (cantidadInput.value < 1) cantidadInput.value = 1; // Asegura que la cantidad sea al menos 1
    });

    // Evento para confirmar la personalización y agregar al carrito
    btnConfirmar.addEventListener("click", function () {
        productoActual.cantidad = parseInt(cantidadInput.value); // Obtiene la cantidad ingresada
        productoActual.comentario = comentarioInput.value; // Obtiene el comentario ingresado
        carrito.push(productoActual); // Agrega el producto al carrito
        actualizarCarrito(); // Actualiza la visualización del carrito

        // Muestra un mensaje de confirmación con un ícono de check verde
        document.getElementById('confirmationMessage').innerHTML = `<span style="color: green; font-size: 2rem;">✅</span><br>${productoActual.Nombre} ha sido agregado con éxito!`;
        confirmationModal.show(); // Muestra el modal de confirmación
        setTimeout(() => confirmationModal.hide(), 1000); // Cierra el modal después de 1 segundo

        personalizarModal.hide(); // Cierra el modal de personalización
    });

    // Función para actualizar y mostrar los productos en el carrito
    function actualizarCarrito() {
        listaCarrito.innerHTML = ""; // Limpia la lista actual del carrito
        let total = 0; // Inicializa el total
        carrito.forEach((producto, index) => {
            const li = document.createElement("li");
            li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2"); // Clases de Bootstrap para diseño
            li.innerHTML = `${producto.cantidad}x ${producto.Nombre} - $${(parseFloat(producto.Precio) * producto.cantidad).toFixed(2)} ${producto.comentario ? `(${producto.comentario})` : ""}`; // Muestra cantidad, nombre, precio y comentario
            const btnEliminar = document.createElement("button"); // Botón para eliminar el producto
            btnEliminar.textContent = "X"; // Texto del botón
            btnEliminar.classList.add("btn", "btn-danger", "ms-2"); // Clases de Bootstrap para estilo
            btnEliminar.addEventListener("click", () => {
                carrito.splice(index, 1); // Elimina el producto del carrito
                actualizarCarrito(); // Actualiza la visualización nuevamente
            });
            li.appendChild(btnEliminar); // Agrega el botón al item de la lista
            listaCarrito.appendChild(li); // Agrega el item a la lista del carrito
            total += parseFloat(producto.Precio) * producto.cantidad; // Suma al total
        });
        totalPedido.textContent = `$${total.toFixed(2)}`; // Actualiza el total en el modal
        fixedTotal.textContent = `$${total.toFixed(2)}`; // Actualiza el total en el botón fijo
        localStorage.setItem("carrito", JSON.stringify(carrito)); // Guarda el carrito en localStorage
    }

    // Evento para mostrar u ocultar el campo de monto en efectivo según la forma de pago
    document.getElementById("formaPago").addEventListener("change", function () {
        const efectivoMonto = document.getElementById("efectivoMonto");
        efectivoMonto.style.display = this.value === "efectivo" ? "block" : "none"; // Muestra u oculta el campo según el valor
    });

    // Evento para mostrar las opciones de envío cuando se ingresa un nombre
    document.getElementById("nombre").addEventListener("input", function () {
        const opcionesEnvio = document.getElementById("opcionesEnvio");
        opcionesEnvio.style.display = this.value.trim() ? "block" : "none"; // Muestra las opciones si hay nombre
    });

    // Evento para seleccionar Delivery como tipo de envío
    const btnDelivery = document.getElementById("btnDelivery");
    btnDelivery.addEventListener("click", () => {
        tipoEnvio = "Delivery"; // Establece el tipo de envío
        document.getElementById("camposDelivery").style.display = "block"; // Muestra los campos de entrega
        document.getElementById("mensajeTakeaway").style.display = "none"; // Oculta el mensaje de takeaway
        btnDelivery.classList.add("btn-active"); // Activa el estilo del botón
        btnTakeaway.classList.remove("btn-active"); // Desactiva el estilo del otro botón
    });

    // Evento para seleccionar Takeaway como tipo de envío
    const btnTakeaway = document.getElementById("btnTakeaway");
    btnTakeaway.addEventListener("click", () => {
        tipoEnvio = "Takeaway"; // Establece el tipo de envío
        document.getElementById("camposDelivery").style.display = "none"; // Oculta los campos de entrega
        document.getElementById("mensajeTakeaway").style.display = "block"; // Muestra el mensaje de takeaway
        btnTakeaway.classList.add("btn-active"); // Activa el estilo del botón
        btnDelivery.classList.remove("btn-active"); // Desactiva el estilo del otro botón
    });

    // Evento para enviar el pedido por WhatsApp
    enviarPedido.addEventListener("click", () => {
        const nombre = document.getElementById("nombre").value.trim(); // Obtiene el nombre ingresado
        const pago = document.getElementById("formaPago").value; // Obtiene la forma de pago

        // Validaciones antes de enviar
        if (carrito.length === 0) {
            alert("El carrito está vacío. Agrega productos antes de enviar el pedido."); // Alerta si el carrito está vacío
            return;
        }
        if (!nombre || !pago || !tipoEnvio) {
            alert("Por favor, completa los campos obligatorios: Nombre, Forma de pago y elige Delivery o Takeaway."); // Alerta si faltan campos
            return;
        }

        // Construye el mensaje para WhatsApp
        let mensaje = "*Hola! Quiero hacer un pedido:*\n\n";
        carrito.forEach(prod => {
            mensaje += `${prod.cantidad}x ${prod.Nombre} - $${(parseFloat(prod.Precio) * prod.cantidad).toFixed(2)} ${prod.comentario ? `(${prod.comentario})` : ""}\n`; // Detalle de cada producto
        });
        mensaje += `\n*Total:* ${totalPedido.textContent}\n\n`; // Total del pedido
        mensaje += `*Nombre:* ${nombre}\n`; // Nombre del cliente

        // Agrega detalles según el tipo de envío
        if (tipoEnvio === "Delivery") {
            const domicilio = document.getElementById("domicilio").value.trim(); // Domicilio
            const localidad = document.getElementById("localidad").value.trim(); // Localidad
            const entreCalles = document.getElementById("entreCalles").value; // Entre calles (opcional)
            if (!domicilio || !localidad) {
                alert("Para Delivery, completa Domicilio y Localidad."); // Alerta si faltan campos
                return;
            }
            mensaje += `*Domicilio:* ${domicilio}\n`; // Agrega el domicilio
            if (entreCalles) mensaje += `Entre calles: ${entreCalles}\n`; // Agrega entre calles si existe
            mensaje += `*Localidad:* ${localidad}\n`; // Agrega la localidad
        } else if (tipoEnvio === "Takeaway") {
            mensaje += "*Retiro:* Av Caamaño 844, Pilar\n"; // Dirección para retiro en el local
        }

        // Agrega detalles de pago, comentario y cupón
        const montoEfectivo = document.getElementById("efectivoMonto").value; // Monto en efectivo (si aplica)
        const comentarioPedido = document.getElementById("comentarioPedido").value; // Comentario opcional
        const cupon = document.getElementById("cupon").value; // Cupón (opcional)

        mensaje += `*Forma de pago:* ${pago}`; // Forma de pago
        if (pago === "efectivo" && montoEfectivo) mensaje += ` (Con: ${montoEfectivo})`; // Agrega monto si es efectivo
        mensaje += "\n";
        if (comentarioPedido) mensaje += `Comentario: ${comentarioPedido}\n`; // Agrega comentario si existe
        if (cupon) mensaje += `Cupón: ${cupon}\n`; // Agrega cupón si existe

        // Abre WhatsApp con el mensaje codificado
        window.open(`https://wa.me/5491140445556?text=${encodeURIComponent(mensaje)}`);
    });

    // Evento para abrir el modal del carrito al hacer clic en "Ver carrito"
    verCarrito.addEventListener("click", () => carritoModal.show());

    // Llama a la función para inicializar el carrito al cargar la página
    actualizarCarrito();
});