// script.js
// Copyright @cloverdigital.arg 2025
// Este archivo contiene las funcionalidades JavaScript para la interactividad del sitio web de Looki Bar,
// incluyendo manejo de la pantalla de bienvenida, carga de productos desde Google Sheets, gestión del
// carrito, modales de personalización, y envío de pedidos por WhatsApp.

// Espera a que el DOM esté completamente cargado para ejecutar las funciones
document.addEventListener("DOMContentLoaded", async function () {
    // Elementos de la pantalla de bienvenida y contenido principal
    const welcomeScreen = document.getElementById("welcome-screen");
    const appContent = document.getElementById("app-content");
    const enterBtn = document.getElementById("enter-btn");

    // Elementos relacionados con la app y el manejo de productos/carrito
    const SHEET_URL = "https://opensheet.elk.sh/1oVfG1dhrkutkOWe7hELdONDnQyRTtSYITpoYHvpTZLQ/menu";
    const categoriasContainer = document.getElementById("categorias-container");
    const listaCarrito = document.getElementById("listaCarrito");
    const totalPedido = document.getElementById("totalPedido");
    const fixedTotal = document.getElementById("fixedTotal");
    const verCarrito = document.getElementById("verCarrito");
    const enviarPedido = document.getElementById("enviarPedido");
    const footer = document.querySelector("footer");

    // Instancias de modales de Bootstrap para productos, personalización, carrito y confirmación
    const productoModal = new bootstrap.Modal(document.getElementById("popup"));
    const personalizarModal = new bootstrap.Modal(document.getElementById("personalizar"));
    const carritoModal = new bootstrap.Modal(document.getElementById("carrito"));
    const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));

    // Elementos dentro de los modales
    const popupTitulo = document.getElementById("popupTitulo");
    const popupImagen = document.getElementById("popupImagen");
    const popupDescripcion = document.getElementById("popupDescripcion");
    const popupPrecio = document.getElementById("popupPrecio");
    const btnProceder = document.getElementById("btnProceder");

    const cantidadInput = document.getElementById("cantidadInput");
    const comentarioInput = document.getElementById("comentarioInput");
    const btnConfirmar = document.getElementById("btnConfirmar");

    // Variables globales para gestionar el carrito y el tipo de envío
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let productoActual = {};
    let tipoEnvio = "";
    let ultimoElementoFocado = null; // Para guardar el elemento enfocado antes de abrir un modal

    // Asegurarse de que la pantalla de bienvenida esté visible y la app oculta al inicio
    welcomeScreen.classList.remove("hidden");
    appContent.classList.add("hidden");

    // Evento para el botón "Ingresar" que inicia la app y carga los productos
    enterBtn.addEventListener("click", function () {
        welcomeScreen.classList.add("hidden");
        appContent.classList.remove("hidden");

        // Mostrar el spinner y cargar productos automáticamente
        const loadingSpinner = document.getElementById("loading-spinner");
        loadingSpinner.style.display = "flex";
        cargarProductos()
            .then(() => {
                loadingSpinner.style.display = "none";
            })
            .catch((error) => {
                loadingSpinner.style.display = "none";
                document.getElementById('confirmationMessage').innerHTML = `<span style="color: red; font-size: 2rem;">⚠️</span><br>Hubo un error al cargar los productos.`;
                confirmationModal.show();
                setTimeout(() => confirmationModal.hide(), 2000);
            });
    });

    // Función debounce para limitar la frecuencia de ejecución de funciones (evita sobrecarga)
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Función para ajustar dinámicamente la posición del carrito según la posición del footer
    function ajustarCarrito() {
        const footerHeight = footer.offsetHeight;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const currentScroll = window.pageYOffset;

        if (currentScroll + windowHeight >= documentHeight - footerHeight) {
            footer.classList.add("fixed");
            verCarrito.style.transform = `translateY(-${footerHeight}px)`;
        } else {
            footer.classList.remove("fixed");
            verCarrito.style.transform = "translateY(0)";
        }
    }

    // Escucha eventos de scroll y redimensiones para ajustar el carrito dinámicamente
    window.addEventListener("scroll", debounce(ajustarCarrito, 100));
    window.addEventListener("resize", debounce(ajustarCarrito, 100));

    // Llama a la función al cargar para inicializar la posición del carrito
    ajustarCarrito();

    // Función asíncrona para cargar los productos desde Google Sheets
    async function cargarProductos() {
        const loadingSpinner = document.getElementById("loading-spinner");
        try {
            loadingSpinner.style.display = "flex";
            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();

            categoriasContainer.innerHTML = "";

            // Organiza los productos por categorías
            const categorias = {};
            data.forEach(producto => {
                if (producto.Activo === "SI") {
                    const categoria = producto.Categoría || "Sin categoría";
                    if (!categorias[categoria]) {
                        categorias[categoria] = [];
                    }
                    categorias[categoria].push(producto);
                }
            });

            // Si no hay productos, muestra un mensaje de error
            if (Object.keys(categorias).length === 0) {
                categoriasContainer.innerHTML = '<p class="text-danger">No hay productos disponibles.</p>';
                loadingSpinner.style.display = "none";
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
                        <strong class="ms-auto">$${Math.round(parseFloat(producto.Precio || 0))}</strong>
                    `;
                    div.addEventListener("click", () => abrirModalProducto(producto));
                    accordionBody.appendChild(div);
                });

                categoriasContainer.appendChild(accordionItem);
            });
            loadingSpinner.style.display = "none";
        } catch (error) {
            categoriasContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
            loadingSpinner.style.display = "none";
        }
    }

    // Función para abrir el modal del producto con los detalles
    function abrirModalProducto(producto) {
        ultimoElementoFocado = document.activeElement; // Guardar el elemento que tenía el foco
        productoActual = { ...producto, cantidad: 1, comentario: "" };
        popupTitulo.textContent = producto.Nombre;
        popupImagen.src = producto.Imagen || 'https://via.placeholder.com/150';
        popupDescripcion.textContent = producto.Descripción;
        popupPrecio.textContent = `$${Math.round(parseFloat(producto.Precio || 0))}`;
        cantidadInput.value = 1;
        comentarioInput.value = "";
        productoModal.show();
        setTimeout(() => document.getElementById("btnProceder").focus(), 100); // Enfocar después de abrir
    }

    // Evento para el botón "Agregar" en el modal de producto, que abre el modal de personalización
    btnProceder.addEventListener("click", function () {
        productoModal.hide();
        personalizarModal.show();
        setTimeout(() => document.getElementById("cantidadInput").focus(), 100); // Enfocar después de abrir
    });

    // Evento para incrementar la cantidad en el modal de personalización
    document.getElementById("btnIncrementar").addEventListener("click", () => cantidadInput.value++);

    // Evento para decrementar la cantidad, asegurando que no baje de 1
    document.getElementById("btnDecrementar").addEventListener("click", () => cantidadInput.value = Math.max(1, cantidadInput.value - 1));

    // Evento para validar que la cantidad no sea menor a 1 al escribir manualmente
    cantidadInput.addEventListener("input", () => {
        if (cantidadInput.value < 1) cantidadInput.value = 1;
    });

    // Evento para confirmar la personalización y agregar al carrito
    btnConfirmar.addEventListener("click", function () {
        productoActual.cantidad = parseInt(cantidadInput.value);
        productoActual.comentario = comentarioInput.value;
        carrito.push(productoActual);
        actualizarCarrito();

        // Muestra un mensaje de confirmación con un ícono de check verde
        document.getElementById('confirmationMessage').innerHTML = `<span style="color: green; font-size: 2rem;">✅</span><br>${productoActual.Nombre} ha sido agregado con éxito!`;
        personalizarModal.hide(); // Cerrar primero el modal de personalización
        confirmationModal.show();
        setTimeout(() => {
            confirmationModal.hide();
            if (ultimoElementoFocado) ultimoElementoFocado.focus(); // Devolver el foco al elemento original
        }, 1000);
    });

    // Función para actualizar y mostrar los productos en el carrito
    function actualizarCarrito() {
        listaCarrito.innerHTML = "";
        let total = 0;
        carrito.forEach((producto, index) => {
            const li = document.createElement("li");
            li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2");
            li.innerHTML = `${producto.cantidad}x ${producto.Nombre} - $${Math.round(parseFloat(producto.Precio) * producto.cantidad)} ${producto.comentario ? `(${producto.comentario})` : ""}`;
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "X";
            btnEliminar.classList.add("btn", "btn-danger", "ms-2");
            btnEliminar.addEventListener("click", () => {
                carrito.splice(index, 1);
                actualizarCarrito();
            });
            li.appendChild(btnEliminar);
            listaCarrito.appendChild(li);
            total += parseFloat(producto.Precio) * producto.cantidad;
        });
        totalPedido.textContent = `$${Math.round(total)}`;
        fixedTotal.textContent = `$${Math.round(total)}`;
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    // Evento para mostrar u ocultar el campo de monto en efectivo según la forma de pago
    document.getElementById("formaPago").addEventListener("change", function () {
        const efectivoMonto = document.getElementById("efectivoMonto");
        efectivoMonto.style.display = this.value === "efectivo" ? "block" : "none";
    });

    // Evento para mostrar las opciones de envío cuando se ingresa un nombre
    document.getElementById("nombre").addEventListener("input", function () {
        const opcionesEnvio = document.getElementById("opcionesEnvio");
        opcionesEnvio.style.display = this.value.trim() ? "block" : "none";
    });

    // Evento para seleccionar Delivery como tipo de envío
    const btnDelivery = document.getElementById("btnDelivery");
    btnDelivery.addEventListener("click", () => {
        tipoEnvio = "Delivery";
        document.getElementById("camposDelivery").style.display = "block";
        document.getElementById("mensajeTakeaway").style.display = "none";
        btnDelivery.classList.add("btn-active");
        btnTakeaway.classList.remove("btn-active");
    });

    // Evento para seleccionar Takeaway como tipo de envío
    const btnTakeaway = document.getElementById("btnTakeaway");
    btnTakeaway.addEventListener("click", () => {
        tipoEnvio = "Takeaway";
        document.getElementById("camposDelivery").style.display = "none";
        document.getElementById("mensajeTakeaway").style.display = "block";
        btnTakeaway.classList.add("btn-active");
        btnDelivery.classList.remove("btn-active");
    });

    // Evento para enviar el pedido por WhatsApp
    enviarPedido.addEventListener("click", () => {
        const nombre = document.getElementById("nombre").value.trim();
        const pago = document.getElementById("formaPago").value;

        // Validaciones antes de enviar
        if (carrito.length === 0) {
            document.getElementById('confirmationMessage').innerHTML = `<span style="color: red; font-size: 2rem;">⚠️</span><br>El carrito está vacío. Agrega productos antes de enviar el pedido.`;
            confirmationModal.show();
            setTimeout(() => confirmationModal.hide(), 2000);
            return;
        }
        if (!nombre || !pago || !tipoEnvio) {
            document.getElementById('confirmationMessage').innerHTML = `<span style="color: red; font-size: 2rem;">⚠️</span><br>Por favor, completa los campos obligatorios: Nombre, Forma de pago y elige Delivery o Takeaway.`;
            confirmationModal.show();
            setTimeout(() => confirmationModal.hide(), 2000);
            return;
        }

        // Construye el mensaje para WhatsApp
        let mensaje = "*Hola! Quiero hacer un pedido:*\n\n";
        carrito.forEach(prod => {
            mensaje += `${prod.cantidad}x ${prod.Nombre} - $${Math.round(parseFloat(prod.Precio) * prod.cantidad)} ${prod.comentario ? `(${prod.comentario})` : ""}\n`;
        });
        mensaje += `\n*Total:* ${totalPedido.textContent}\n\n`;
        mensaje += `*Nombre:* ${nombre}\n`;

        // Agrega detalles según el tipo de envío
        if (tipoEnvio === "Delivery") {
            const domicilio = document.getElementById("domicilio").value.trim();
            const localidad = document.getElementById("localidad").value.trim();
            const entreCalles = document.getElementById("entreCalles").value;
            if (!domicilio || !localidad) {
                document.getElementById('confirmationMessage').innerHTML = `<span style="color: red; font-size: 2rem;">⚠️</span><br>Para Delivery, completa Domicilio y Localidad.`;
                confirmationModal.show();
                setTimeout(() => confirmationModal.hide(), 2000);
                return;
            }
            mensaje += `*Domicilio:* ${domicilio}\n`;
            if (entreCalles) mensaje += `Entre calles: ${entreCalles}\n`;
            mensaje += `*Localidad:* ${localidad}\n`;
        } else if (tipoEnvio === "Takeaway") {
            mensaje += "*Retiro:* Av Caamaño 844, Pilar\n";
        }

        // Agrega detalles de pago, comentario y cupón
        const montoEfectivo = document.getElementById("efectivoMonto").value;
        const comentarioPedido = document.getElementById("comentarioPedido").value;
        const cupon = document.getElementById("cupon").value;

        mensaje += `*Forma de pago:* ${pago}`;
        if (pago === "efectivo" && montoEfectivo) mensaje += ` (Con: ${montoEfectivo})`;
        mensaje += "\n";
        if (comentarioPedido) mensaje += `Comentario: ${comentarioPedido}\n`;
        if (cupon) mensaje += `Cupón: ${cupon}\n`;

        // Abre WhatsApp con el mensaje codificado
        window.open(`https://wa.me/5491148887566?text=${encodeURIComponent(mensaje)}`);
    });

    // Evento para abrir el modal del carrito al hacer clic en "Ver carrito"
    verCarrito.addEventListener("click", () => {
        ultimoElementoFocado = document.activeElement;
        carritoModal.show();
        setTimeout(() => document.getElementById("nombre").focus(), 100); // Enfocar después de abrir
    });

    // Gestionar el foco al cerrar modales manualmente
    document.getElementById("popup").addEventListener("hidden.bs.modal", () => {
        if (ultimoElementoFocado && !personalizarModal._isShown) ultimoElementoFocado.focus();
    });

    document.getElementById("personalizar").addEventListener("hidden.bs.modal", () => {
        if (ultimoElementoFocado && !confirmationModal._isShown) ultimoElementoFocado.focus();
    });

    document.getElementById("carrito").addEventListener("hidden.bs.modal", () => {
        if (ultimoElementoFocado) ultimoElementoFocado.focus();
    });

    document.getElementById("confirmationModal").addEventListener("hidden.bs.modal", () => {
        if (ultimoElementoFocado) ultimoElementoFocado.focus();
    });

    // Llama a la función para inicializar el carrito al cargar la página
    actualizarCarrito();
});