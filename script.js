document.addEventListener("DOMContentLoaded", async function () {
    const SHEET_URL = "https://opensheet.elk.sh/1oVfG1dhrkutkOWe7hELdONDnQyRTtSYITpoYHvpTZLQ/menu";
    const container = document.getElementById("productos-container");
    const listaCarrito = document.getElementById("listaCarrito");
    const totalPedido = document.getElementById("totalPedido");
    const fixedTotal = document.getElementById("fixedTotal");
    const verCarrito = document.getElementById("verCarrito");
    const enviarPedido = document.getElementById("enviarPedido");
    
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

    let carrito = [];
    let productoActual = {};

    async function cargarProductos() {
        try {
            const response = await fetch(SHEET_URL);
            const data = await response.json();
            container.innerHTML = "";

            data.forEach(producto => {
                if (producto.Activo === "SI") {
                    const div = document.createElement("div");
                    div.className = "producto d-flex align-items-center p-3 border rounded mb-3";
                    div.innerHTML = `
                        <img src="${producto.Imagen}" class="img-fluid me-3 rounded" style="width: 80px;">
                        <div>
                            <h5>${producto.Nombre}</h5>
                            <p class="text-muted">${producto.Descripción}</p>
                        </div>
                        <strong class="ms-auto">$${parseFloat(producto.Precio).toFixed(2)}</strong>
                    `;
                    div.addEventListener("click", () => abrirModalProducto(producto));
                    container.appendChild(div);
                }
            });
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }

    function abrirModalProducto(producto) {
        productoActual = { ...producto, cantidad: 1, comentario: "" };
        popupTitulo.textContent = producto.Nombre;
        popupImagen.src = producto.Imagen;
        popupDescripcion.textContent = producto.Descripción;
        popupPrecio.textContent = `$${parseFloat(producto.Precio).toFixed(2)}`;
        productoModal.show();
    }

    btnProceder.addEventListener("click", function () {
        productoModal.hide();
        personalizarModal.show();
    });

    document.getElementById("btnIncrementar").addEventListener("click", () => cantidadInput.value++);
    document.getElementById("btnDecrementar").addEventListener("click", () => cantidadInput.value = Math.max(1, cantidadInput.value - 1));

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
            li.innerHTML = `${producto.cantidad}x ${producto.Nombre} - $${(producto.Precio * producto.cantidad).toFixed(2)} ${producto.comentario ? `(${producto.comentario})` : ""}`;
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "X";
            btnEliminar.classList.add("btn", "btn-danger", "ms-2");
            btnEliminar.addEventListener("click", () => {
                carrito.splice(index, 1);
                actualizarCarrito();
            });
            li.appendChild(btnEliminar);
            listaCarrito.appendChild(li);
            total += producto.Precio * producto.cantidad;
        });
        totalPedido.textContent = `$${total.toFixed(2)}`;
        fixedTotal.textContent = `$${total.toFixed(2)}`;
    }

    document.getElementById("formaPago").addEventListener("change", function () {
        document.getElementById("efectivoMonto").style.display = this.value === "efectivo" ? "block" : "none";
    });

    enviarPedido.addEventListener("click", () => {
        if (carrito.length === 0) {
            alert("El carrito está vacío. Agrega productos antes de enviar el pedido.");
            return;
        }

        const nombre = document.getElementById("nombre").value;
        const domicilio = document.getElementById("domicilio").value;
        const entreCalles = document.getElementById("entreCalles").value;
        const pago = document.getElementById("formaPago").value;
        const montoEfectivo = document.getElementById("efectivoMonto").value;
        const comentarioPedido = document.getElementById("comentarioPedido").value;
        const cupon = document.getElementById("cupon").value;
        
        let mensaje = "Hola! Quiero hacer un pedido:\n\n";
        carrito.forEach(prod => {
            mensaje += `${prod.cantidad}x ${prod.Nombre} - $${(prod.Precio * prod.cantidad).toFixed(2)} ${prod.comentario ? `(${prod.comentario})` : ""}\n`;
        });
        mensaje += `\nTotal: ${totalPedido.textContent}\n\n`;
        mensaje += `Nombre: ${nombre}\nDomicilio: ${domicilio}\nEntre calles: ${entreCalles}\nForma de pago: ${pago}`;
        if (pago === "efectivo") mensaje += ` (Con: ${montoEfectivo})`;
        mensaje += `\nComentario: ${comentarioPedido}\nCupón: ${cupon}\n`;
        
        window.open(`https://wa.me/5491148887566?text=${encodeURIComponent(mensaje)}`);
    });

    verCarrito.addEventListener("click", () => carritoModal.show());
    cargarProductos();
});
