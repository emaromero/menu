document.addEventListener("DOMContentLoaded", async function () {
    // Elementos de la pantalla de bienvenida
    const welcomeScreen = document.getElementById("welcome-screen");
    const appContent = document.getElementById("app-content");
    const enterBtn = document.getElementById("enter-btn");

    // Elementos de la app
    const SHEET_URL = "https://opensheet.elk.sh/1oVfG1dhrkutkOWe7hELdONDnQyRTtSYITpoYHvpTZLQ/menu";
    const categoriasContainer = document.getElementById("categorias-container");
    const listaCarrito = document.getElementById("listaCarrito");
    const totalPedido = document.getElementById("totalPedido");
    const fixedTotal = document.getElementById("fixedTotal");
    const verCarrito = document.getElementById("verCarrito");
    const enviarPedido = document.getElementById("enviarPedido");
    const footer = document.querySelector("footer");

    const productoModal = new bootstrap.Modal(document.getElementById("popup"));
    const personalizarModal = new bootstrap.Modal(document.getElementById("personalizar"));
    const carritoModal = new bootstrap.Modal(document.getElementById("carrito"));
    const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));

    const popupTitulo = document.getElementById("popupTitulo");
    const popupImagen = document.getElementById("popupImagen");
    const popupDescripcion = document.getElementById("popupDescripcion");
    const popupPrecio = document.getElementById("popupPrecio");
    const btnProceder = document.getElementById("btnProceder");

    const cantidadInput = document.getElementById("cantidadInput");
    const comentarioInput = document.getElementById("comentarioInput");
    const btnConfirmar = document.getElementById("btnConfirmar");

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let productoActual = {};
    let tipoEnvio = "";

    // Asegurarse de que la pantalla de bienvenida esté visible y la app oculta al inicio
    welcomeScreen.classList.remove("hidden");
    appContent.classList.add("hidden");

    // Evento para el botón "Ingresar"
    enterBtn.addEventListener("click", function () {
        console.log("Botón Ingresar clickeado");
        welcomeScreen.classList.add("hidden");
        appContent.classList.remove("hidden");
        
        // Mostrar el spinner y cargar productos automáticamente
        const loadingSpinner = document.getElementById("loading-spinner");
        loadingSpinner.style.display = "flex"; // Mostrar spinner
        cargarProductos()
            .then(() => {
                console.log("Productos cargados exitosamente");
                loadingSpinner.style.display = "none"; // Ocultar spinner
            })
            .catch((error) => {
                console.error("Error al cargar productos:", error);
                loadingSpinner.style.display = "none";
                alert("Hubo un error al cargar los productos.");
            });
    });

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Función para ajustar el carrito dinámicamente según el footer
    function ajustarCarrito() {
        const footerHeight = footer.offsetHeight;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const currentScroll = window.pageYOffset;

        if (currentScroll + windowHeight >= documentHeight - footerHeight) {
            footer.classList.add("fixed");
            // Cuando el footer está fijo, el carrito debe estar justo encima
            verCarrito.style.transform = `translateY(-${footerHeight}px)`;
        } else {
            footer.classList.remove("fixed");
            // Cuando el footer no está fijo, el carrito vuelve a su posición base
            verCarrito.style.transform = "translateY(0)";
        }
    }

    // Escuchar el scroll para ajustar el carrito y footer
    window.addEventListener("scroll", debounce(ajustarCarrito, 100));
    window.addEventListener("resize", debounce(ajustarCarrito, 100)); // Ajustar también en redimensiones

    // Llamar a la función al cargar para inicializar
    ajustarCarrito();

    async function cargarProductos() {
        const loadingSpinner = document.getElementById("loading-spinner");
        try {
            console.log("Intentando cargar productos desde:", SHEET_URL);
            loadingSpinner.style.display = "flex"; // Mostrar spinner
            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Datos recibidos:", data);

            categoriasContainer.innerHTML = "";

            const categorias = {};
            data.forEach(producto => {
                console.log("Procesando producto:", producto);
                if (producto.Activo === "SI") { // Ajusta este valor si es diferente
                    const categoria = producto.Categoría || "Sin categoría";
                    if (!categorias[categoria]) {
                        categorias[categoria] = [];
                    }
                    categorias[categoria].push(producto);
                }
            });

            if (Object.keys(categorias).length === 0) {
                categoriasContainer.innerHTML = '<p class="text-danger">No hay productos disponibles.</p>';
                loadingSpinner.style.display = "none";
                return;
            }

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
                    div.addEventListener("click", () => abrirModalProducto(producto));
                    accordionBody.appendChild(div);
                });

                categoriasContainer.appendChild(accordionItem);
            });
            loadingSpinner.style.display = "none"; // Ocultar spinner
        } catch (error) {
            console.error("Error al cargar productos:", error);
            categoriasContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
            loadingSpinner.style.display = "none";
        }
    }

    function abrirModalProducto(producto) {
        productoActual = { ...producto, cantidad: 1, comentario: "" };
        popupTitulo.textContent = producto.Nombre;
        popupImagen.src = producto.Imagen || 'https://via.placeholder.com/150';
        popupDescripcion.textContent = producto.Descripción;
        popupPrecio.textContent = `$${parseFloat(producto.Precio || 0).toFixed(2)}`;
        cantidadInput.value = 1;
        comentarioInput.value = "";
        productoModal.show();
    }

    btnProceder.addEventListener("click", function () {
        productoModal.hide();
        personalizarModal.show();
    });

    document.getElementById("btnIncrementar").addEventListener("click", () => cantidadInput.value++);
    document.getElementById("btnDecrementar").addEventListener("click", () => cantidadInput.value = Math.max(1, cantidadInput.value - 1));
    cantidadInput.addEventListener("input", () => {
        if (cantidadInput.value < 1) cantidadInput.value = 1;
    });

    btnConfirmar.addEventListener("click", function () {
        productoActual.cantidad = parseInt(cantidadInput.value);
        productoActual.comentario = comentarioInput.value;
        carrito.push(productoActual);
        actualizarCarrito();

        document.getElementById('confirmationMessage').innerHTML = `<span style="color: green; font-size: 2rem;">✅</span><br>${productoActual.Nombre} ha sido agregado con éxito!`;
        confirmationModal.show();
        setTimeout(() => confirmationModal.hide(), 1000);

        personalizarModal.hide();
    });

    function actualizarCarrito() {
        listaCarrito.innerHTML = "";
        let total = 0;
        carrito.forEach((producto, index) => {
            const li = document.createElement("li");
            li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2");
            li.innerHTML = `${producto.cantidad}x ${producto.Nombre} - $${(parseFloat(producto.Precio) * producto.cantidad).toFixed(2)} ${producto.comentario ? `(${producto.comentario})` : ""}`;
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
        totalPedido.textContent = `$${total.toFixed(2)}`;
        fixedTotal.textContent = `$${total.toFixed(2)}`;
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    document.getElementById("formaPago").addEventListener("change", function () {
        document.getElementById("efectivoMonto").style.display = this.value === "efectivo" ? "block" : "none";
    });

    document.getElementById("nombre").addEventListener("input", function () {
        const opcionesEnvio = document.getElementById("opcionesEnvio");
        opcionesEnvio.style.display = this.value.trim() ? "block" : "none";
    });

    const btnDelivery = document.getElementById("btnDelivery");
    const btnTakeaway = document.getElementById("btnTakeaway");

    btnDelivery.addEventListener("click", () => {
        tipoEnvio = "Delivery";
        document.getElementById("camposDelivery").style.display = "block";
        document.getElementById("mensajeTakeaway").style.display = "none";
        btnDelivery.classList.add("btn-active");
        btnTakeaway.classList.remove("btn-active");
    });

    btnTakeaway.addEventListener("click", () => {
        tipoEnvio = "Takeaway";
        document.getElementById("camposDelivery").style.display = "none";
        document.getElementById("mensajeTakeaway").style.display = "block";
        btnTakeaway.classList.add("btn-active");
        btnDelivery.classList.remove("btn-active");
    });

    enviarPedido.addEventListener("click", () => {
        const nombre = document.getElementById("nombre").value.trim();
        const pago = document.getElementById("formaPago").value;

        if (carrito.length === 0) {
            alert("El carrito está vacío. Agrega productos antes de enviar el pedido.");
            return;
        }
        if (!nombre || !pago || !tipoEnvio) {
            alert("Por favor, completa los campos obligatorios: Nombre, Forma de pago y elige Delivery o Takeaway.");
            return;
        }

        let mensaje = "*Hola! Quiero hacer un pedido:*\n\n";
        carrito.forEach(prod => {
            mensaje += `${prod.cantidad}x ${prod.Nombre} - $${(parseFloat(prod.Precio) * prod.cantidad).toFixed(2)} ${prod.comentario ? `(${prod.comentario})` : ""}\n`;
        });
        mensaje += `\n*Total:* ${totalPedido.textContent}\n\n`;
        mensaje += `*Nombre:* ${nombre}\n`;

        if (tipoEnvio === "Delivery") {
            const domicilio = document.getElementById("domicilio").value.trim();
            const localidad = document.getElementById("localidad").value.trim();
            const entreCalles = document.getElementById("entreCalles").value;
            if (!domicilio || !localidad) {
                alert("Para Delivery, completa Domicilio y Localidad.");
                return;
            }
            mensaje += `*Domicilio:* ${domicilio}\n`;
            if (entreCalles) mensaje += `Entre calles: ${entreCalles}\n`;
            mensaje += `*Localidad:* ${localidad}\n`;
        } else if (tipoEnvio === "Takeaway") {
            mensaje += "*Retiro:* Av Caamaño 844, Pilar\n";
        }

        const montoEfectivo = document.getElementById("efectivoMonto").value;
        const comentarioPedido = document.getElementById("comentarioPedido").value;
        const cupon = document.getElementById("cupon").value;

        mensaje += `*Forma de pago:* ${pago}`;
        if (pago === "efectivo" && montoEfectivo) mensaje += ` (Con: ${montoEfectivo})`;
        mensaje += "\n";
        if (comentarioPedido) mensaje += `Comentario: ${comentarioPedido}\n`;
        if (cupon) mensaje += `Cupón: ${cupon}\n`;

        window.open(`https://wa.me/5491148887566?text=${encodeURIComponent(mensaje)}`);
    });

    verCarrito.addEventListener("click", () => carritoModal.show());
    actualizarCarrito();
});