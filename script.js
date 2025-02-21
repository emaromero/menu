document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('productos-container');
    let products = JSON.parse(localStorage.getItem('products')) || [];
    container.innerHTML = "";
    
    // Filtrar productos activos y agruparlos por categoría
    const activos = products.filter(product => product.activo);
    const categories = {};
    activos.forEach(product => {
      if (!categories[product.categoria]) {
        categories[product.categoria] = [];
      }
      categories[product.categoria].push(product);
    });
    
    // Renderizar cada categoría en su propia sección
    for (const cat in categories) {
      // Sección para la categoría
      const catSection = document.createElement('div');
      catSection.classList.add("mb-4");
      
      // Encabezado de categoría
      const catHeading = document.createElement('h3');
      catHeading.textContent = cat;
      catSection.appendChild(catHeading);
      
      // Row para los productos de la categoría
      const row = document.createElement('div');
      row.classList.add("row");
      
      categories[cat].forEach(product => {
        const col = document.createElement('div');
        col.className = "col-md-12";
        col.innerHTML = `
          <div class="producto d-flex align-items-center mb-3"
               data-nombre="${product.nombre}"
               data-precio="${product.precio}"
               data-imagen="${product.imagen}"
               data-descripcion="${product.descripcion}">
            <img src="${product.imagen}" class="img-fluid me-3" alt="${product.nombre}">
            <div>
              <p>${product.nombre} - $${product.precio}</p>
            </div>
          </div>
        `;
        row.appendChild(col);
      });
      
      catSection.appendChild(row);
      container.appendChild(catSection);
    }
  });
  
document.addEventListener("DOMContentLoaded", () => {
    let carrito = [];
    const productos = document.querySelectorAll(".producto");
    const listaCarrito = document.getElementById("listaCarrito");
    const totalPedido = document.getElementById("totalPedido");
    const fixedTotal = document.getElementById("fixedTotal");
    // Elementos de Etapa 1 (Información del producto)
    const popupTitulo = document.getElementById("popupTitulo");
    const popupDescripcion = document.getElementById("popupDescripcion");
    const popupPrecio = document.getElementById("popupPrecio");
    const popupImagen = document.getElementById("popupImagen");
    const btnProceder = document.getElementById("btnProceder");
    // Elementos de Etapa 2 (Personalización del pedido)
    const modalCustomize = document.getElementById("modalCustomize");
    const cantidadElem = document.getElementById("cantidad");
    const comentarioElem = document.getElementById("comentario");
    const confirmarAgregar = document.getElementById("confirmarAgregar");
    const sumarBtn = document.getElementById("sumar");
    const restarBtn = document.getElementById("restar");
    // Otros elementos
    const formaPago = document.getElementById("formaPago");
    const efectivoMonto = document.getElementById("efectivoMonto");
    const enviarPedido = document.getElementById("enviarPedido");

    let productoActual = {};

    // Al hacer clic en cualquier producto, se abre el modal (Etapa 1)
    productos.forEach(producto => {
        producto.addEventListener("click", () => {
            productoActual = {
                nombre: producto.dataset.nombre,
                descripcion: producto.dataset.descripcion,
                precio: parseFloat(producto.dataset.precio),
                imagen: producto.dataset.imagen,
                cantidad: 1,
                comentario: ""
            };
            popupTitulo.textContent = productoActual.nombre;
            popupDescripcion.textContent = productoActual.descripcion;
            popupPrecio.textContent = `$${productoActual.precio}`;
            popupImagen.src = productoActual.imagen;
            cantidadElem.textContent = productoActual.cantidad;
            comentarioElem.value = "";
            // Mostrar Etapa 1 y ocultar Etapa 2
            document.getElementById("modalInfo").style.display = "block";
            modalCustomize.style.display = "none";
            // Abrir el modal programáticamente
            let modalPopup = new bootstrap.Modal(document.getElementById("popup"));
            modalPopup.show();
        });
    });

    // Al hacer clic en "Agregar" (Etapa 1), se pasa a la Etapa 2 para personalizar el pedido
    btnProceder.addEventListener("click", () => {
        document.getElementById("modalInfo").style.display = "none";
        modalCustomize.style.display = "block";
    });

    // Controles de cantidad en Etapa 2
    sumarBtn.addEventListener("click", () => {
        productoActual.cantidad++;
        cantidadElem.textContent = productoActual.cantidad;
    });

    restarBtn.addEventListener("click", () => {
        if (productoActual.cantidad > 1) {
            productoActual.cantidad--;
            cantidadElem.textContent = productoActual.cantidad;
        }
    });

    confirmarAgregar.addEventListener("click", () => {
        productoActual.comentario = comentarioElem.value;
        carrito.push({ ...productoActual });
        actualizarCarrito();
        
        // Mostrar modal de confirmación
        let confModalEl = document.getElementById('confirmationModal');
        let confModal = new bootstrap.Modal(confModalEl);
        document.getElementById('confirmationMessage').innerHTML = `<span style="color: green; font-size: 2rem;">✅</span><br>${productoActual.nombre} ha sido agregado con éxito!`;
        confModal.show();
        
        // Ocultar el modal automáticamente después de 1 segundo (1000 ms)
        setTimeout(() => {
          confModal.hide();
        }, 1000);
    });
    

    // Mostrar u ocultar el campo "Con cuánto?" según la forma de pago
    formaPago.addEventListener("change", () => {
        if (formaPago.value === "efectivo") {
            efectivoMonto.style.display = "block";
        } else {
            efectivoMonto.style.display = "none";
        }
    });

    function actualizarCarrito() {
        listaCarrito.innerHTML = "";
        let total = 0;
        carrito.forEach((producto, index) => {
            const li = document.createElement("li");
            li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2");
            li.textContent = `${producto.cantidad}x ${producto.nombre} - $${producto.precio * producto.cantidad}` + (producto.comentario ? ` (${producto.comentario})` : "");
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "X";
            btnEliminar.classList.add("btn", "btn-danger");
            btnEliminar.addEventListener("click", () => {
                carrito.splice(index, 1);
                actualizarCarrito();
            });
            li.appendChild(btnEliminar);
            listaCarrito.appendChild(li);
            total += producto.precio * producto.cantidad;
        });
        totalPedido.textContent = `$${total}`;
        if (fixedTotal) {
            fixedTotal.textContent = `$${total}`;
        }
    }
    
    enviarPedido.addEventListener("click", () => {
        // Verificar que el total no sea $0
        if (totalPedido.textContent.trim() === "$0") {
          alert("El total debe ser mayor a $0 para enviar el pedido.");
          return;
        }
        
        // Si pasa la verificación, se procede a construir el mensaje y enviar el pedido por WhatsApp
        const nombre = document.getElementById("nombre").value;
        const domicilio = document.getElementById("domicilio").value;
        const entreCalles = document.getElementById("entreCalles").value;
        const pago = formaPago.value;
        const montoEfectivo = efectivoMonto.value;
        const comentarioPedido = document.getElementById("comentarioPedido").value;
        const cupon = document.getElementById("cupon").value;
        
        let mensaje = `Hola! Quiero hacer un pedido:\n\n`;
        carrito.forEach(prod => {
          mensaje += `${prod.cantidad}x ${prod.nombre} - $${prod.precio * prod.cantidad}` +
                     (prod.comentario ? ` (${prod.comentario})` : "") + `\n`;
        });
        mensaje += `\nTotal: ${totalPedido.textContent}\n\n`;
        mensaje += `Nombre: ${nombre}\nDomicilio: ${domicilio}\nEntre calles: ${entreCalles}\nForma de pago: ${pago}`;
        if (pago === "efectivo") mensaje += ` (Con: ${montoEfectivo})`;
        mensaje += `\nComentario: ${comentarioPedido}\nCupón: ${cupon}\n`;
        
        window.open(`https://wa.me/5491148887566?text=${encodeURIComponent(mensaje)}`);
      });
      
});
