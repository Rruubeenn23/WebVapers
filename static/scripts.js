// Función para cargar productos en la sección de compra
function cargarProductosCompra() {
    fetch('/productos')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('productos-compra');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = `<p class="text-center text-yellow-300 text-lg">No hay productos disponibles.</p>`;
                return;
            }

            data.forEach(producto => {
                const card = document.createElement('div');
                card.className = 'bg-gray-800 p-4 rounded-lg shadow-lg text-center w-full sm:w-1/2 md:w-1/3 lg:w-1/4';

                card.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.producto}" class="w-full h-40 object-cover rounded-md border border-gray-700">
                    <h3 class="mt-2 text-lg font-bold text-yellow-300">${producto.producto}</h3>
                    <p class="text-sm text-gray-400">Cantidad disponible: ${producto.cantidad}</p>
                    <button class="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md w-full btn-gestionar-compra"
                        data-producto="${producto.producto}">Gestionar Compra</button>
                `;

                container.appendChild(card);
            });

            // 🔥 Agregar eventos después de que los elementos se hayan creado
            document.querySelectorAll('.btn-gestionar-compra').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const producto = event.target.dataset.producto;
                    abrirModalCompra(producto);
                });
            });
        })
        .catch(error => console.error('Error al cargar productos de compra:', error));
}


// Función para cargar productos en la sección de venta
function cargarProductosVenta() {
    fetch('/productos')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('productos-venta');
            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = `<p class="text-center text-yellow-300 text-lg">No hay productos disponibles.</p>`;
                return;
            }

            data.forEach(producto => {
                const card = document.createElement('div');
                card.className = 'bg-gray-800 p-4 rounded-lg shadow-lg text-center w-full sm:w-1/2 md:w-1/3 lg:w-1/4';

                card.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.producto}" class="w-full h-40 object-cover rounded-md border border-gray-700">
                    <h3 class="mt-2 text-lg font-bold text-yellow-300">${producto.producto}</h3>
                    <p class="text-sm text-gray-400">Cantidad disponible: ${producto.cantidad}</p>
                    <button class="mt-3 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md w-full"
                        onclick="abrirModalVenta('${producto.producto}')">Gestionar Venta</button>
                `;

                container.appendChild(card);
            });
        })
        .catch(error => console.error('Error al cargar productos de venta:', error));
}

// Función para abrir el modal de compra
function abrirModalCompra(producto) {
    const modal = document.getElementById('modal-compra');
    if (!modal) {
        console.error('Modal de compra no encontrado.');
        return;
    }
    
    document.getElementById('modal-compra-title').textContent = `Gestionar Compra: ${producto}`;
    modal.dataset.producto = producto;
    modal.classList.add('show');

    const form = document.getElementById('modal-compra-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const cantidad = document.getElementById('modal-compra-cantidad').value;
        const fecha = document.getElementById('modal-compra-fecha').value;

        if (!cantidad || !fecha) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        añadirCompra(producto, cantidad, fecha);
        cerrarModalCompra();
    };
}

// Función para cerrar el modal de compra
function cerrarModalCompra() {
    const modal = document.getElementById('modal-compra');
    modal.classList.remove('show');
}

// Función para abrir el modal de venta
function abrirModalVenta(producto) {
    const modal = document.getElementById('modal-venta');
    if (!modal) {
        alert('Estás en la página equivocada. Ve a la sección de venta.');
        return;
    }

    document.getElementById('modal-venta-title').textContent = `Gestionar Venta: ${producto}`;
    modal.dataset.producto = producto;
    modal.classList.add('show');

    const form = document.getElementById('modal-venta-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const cantidad = document.getElementById('modal-venta-cantidad').value;
        const fecha = document.getElementById('modal-venta-fecha').value;
        const cliente = document.getElementById('modal-venta-cliente').value;

        if (!cantidad || !fecha || !cliente) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        realizarVenta(producto, cantidad, fecha, cliente);
        cerrarModalVenta();
    };
}

// Función para cerrar el modal de venta
function cerrarModalVenta() {
    const modal = document.getElementById('modal-venta');
    modal.classList.remove('show');
}

// Función para añadir una compra
function añadirCompra(producto, cantidad, fecha) {
    fetch('/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto, cantidad, fecha })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            cargarProductosCompra(); // Recargar productos
        })
        .catch(error => console.error('Error al añadir compra:', error));
}

// Función para realizar una venta
function realizarVenta(producto, cantidad, fecha, cliente) {
    fetch('/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto, cantidad, fecha, cliente })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            cargarProductosVenta(); // Recargar productos
        })
        .catch(error => console.error('Error al realizar venta:', error));
}

// Abrir modal para agregar producto
document.getElementById('btn-agregar-producto').addEventListener('click', () => {
    document.getElementById('modal-agregar').classList.add('show');
});

// Cerrar modal de agregar producto
function cerrarModalAgregar() {
    document.getElementById('modal-agregar').classList.remove('show');
}

// Función para agregar un nuevo producto
document.getElementById('modal-agregar-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const producto = document.getElementById('nuevo-producto-nombre').value;
    const cantidad = document.getElementById('nuevo-producto-cantidad').value;
    const fecha = document.getElementById('nuevo-producto-fecha').value;
    const imagen = document.getElementById('nuevo-producto-imagen').value;

    fetch('/agregar_producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto, cantidad, fecha, imagen })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (!data.error) {
            cerrarModalAgregar();
            cargarProductosCompra(); // Recargar la lista de productos
        }
    })
    .catch(error => console.error('Error al agregar producto:', error));
});

// Detectar en qué página estamos y cargar los productos correspondientes
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productos-compra')) {
        cargarProductosCompra();
    } else if (document.getElementById('productos-venta')) {
        cargarProductosVenta();
    }
});
