from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, Column, Integer, String, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

app = Flask(__name__)
DATABASE_URL = 'sqlite:///vapers.db'

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL, echo=True)
Base = declarative_base()

# Models
class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True)
    producto = Column(String(100), nullable=False, unique=True)
    cantidad = Column(Integer, nullable=False)
    fecha_compra = Column(String(20), nullable=False)
    imagen = Column(String(200), nullable=False)

class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True)
    producto = Column(String(100), nullable=False)
    cantidad = Column(Integer, nullable=False)
    fecha_venta = Column(String(20), nullable=False)
    cliente = Column(String(100), nullable=False)

# Crear todas las tablas en la base de datos
Base.metadata.create_all(engine)

# Crear una sesión para interactuar con la base de datos
Session = sessionmaker(bind=engine)
session = Session()

# Rutas
@app.route('/')
def index():
    return render_template('compra.html')

@app.route('/productos', methods=['GET'])
def obtener_productos():
    productos = session.query(Compra).all()
    productos_json = [{"producto": p.producto, "cantidad": p.cantidad, "imagen": p.imagen} for p in productos]
    return jsonify(productos_json)

@app.route('/comprar', methods=['POST'])
def comprar():
    data = request.json
    producto = data['producto']
    cantidad = int(data['cantidad'])
    fecha = data['fecha']

    compra = session.query(Compra).filter_by(producto=producto).first()
    if compra:
        compra.cantidad += cantidad
        session.commit()
        return jsonify({"message": "Compra registrada correctamente."})
    else:
        return jsonify({"message": "Producto no encontrado."}), 404

@app.route('/vender', methods=['POST'])
def vender():
    data = request.json
    producto = data['producto']
    cantidad = int(data['cantidad'])
    fecha = data['fecha']
    cliente = data['cliente']

    compra = session.query(Compra).filter_by(producto=producto).first()
    if compra and compra.cantidad >= cantidad:
        compra.cantidad -= cantidad
        nueva_venta = Venta(producto=producto, cantidad=cantidad, fecha_venta=fecha, cliente=cliente)
        session.add(nueva_venta)
        session.commit()
        return jsonify({"message": "Venta registrada correctamente."})
    else:
        return jsonify({"message": "No hay suficiente stock o producto no encontrado."}), 400

@app.route('/compra')
def compra():
    return render_template('compra.html')

@app.route('/venta')
def venta():
    return render_template('venta.html')

@app.route('/calculos')
def calculos():
    # Vapers totales vendidos
    vapers_totales_vendidos = session.query(func.count(Venta.id)).scalar() or 0  # Cuenta el total de ventas registradas


    # Vapers más vendidos
    vapers_mas_vendidos = session.query(Venta.producto, func.sum(Venta.cantidad).label('total_vendido'))\
        .group_by(Venta.producto).order_by(func.sum(Venta.cantidad).desc()).limit(10).all()

    # Clientes con más compras
    clientes_mas_compras = session.query(Venta.cliente, func.sum(Venta.cantidad).label('total_comprado'))\
        .group_by(Venta.cliente).order_by(func.sum(Venta.cantidad).desc()).limit(10).all()

    # **1️⃣ Media de tiempo de venta de cada vaper (con corrección de formato)**
    tiempo_promedio_venta = session.query(
        Venta.producto, 
        func.avg(
            func.julianday(Venta.fecha_venta) - func.julianday(
                func.concat(
                    func.substr(Compra.fecha_compra, 7, 4), '-',  # Año
                    func.substr(Compra.fecha_compra, 4, 2), '-',  # Mes
                    func.substr(Compra.fecha_compra, 1, 2)        # Día
                )
            )
        ).label('media_dias')
    ).join(Compra, Compra.producto == Venta.producto).group_by(Venta.producto).all()


    # Vapers que más compra cada cliente
    subquery = session.query(
        Venta.cliente, Venta.producto, func.sum(Venta.cantidad).label('total_comprado')
    ).group_by(Venta.cliente, Venta.producto).subquery()

    clientes_top_vapers = session.query(
        subquery.c.cliente, subquery.c.producto, func.max(subquery.c.total_comprado)
    ).group_by(subquery.c.cliente).all()

    # Hucha (dinero total ganado excluyendo a Rubén)
    hucha = session.query(func.sum(Venta.cantidad * 15)).filter(Venta.cliente != "Rubén").scalar()
    hucha_total = hucha if hucha else 0

    # Cantidad de vapers comprados por Rubén
    ruben_compras = session.query(func.sum(Venta.cantidad)).filter(Venta.cliente == "Rubén").scalar()
    ruben_vapers = ruben_compras if ruben_compras else 0

    # Dinero no ganado por Rubén (-15€ por cada vaper que compró)
    dinero_no_ganado = ruben_vapers * 15

    dinero_si_pagara = hucha_total + dinero_no_ganado

    return render_template(
        'calculos.html', 
        vapers_mas_vendidos=vapers_mas_vendidos, 
        clientes_mas_compras=clientes_mas_compras,
        tiempo_promedio_venta=tiempo_promedio_venta,
        clientes_top_vapers=clientes_top_vapers,
        hucha_total=hucha_total,
        ruben_vapers=ruben_vapers,
        dinero_no_ganado=dinero_no_ganado,
        dinero_si_pagara=dinero_si_pagara,
        vapers_totales_vendidos=vapers_totales_vendidos  
    )

@app.route('/agregar_producto', methods=['POST'])
def agregar_producto():
    data = request.json
    producto = data['producto']
    cantidad = int(data['cantidad'])
    fecha = data['fecha']
    imagen = data['imagen']

    # Verificar si el producto ya existe
    producto_existente = session.query(Compra).filter_by(producto=producto).first()
    if producto_existente:
        return jsonify({"message": "El producto ya existe.", "error": True}), 400

    # Si no existe, agregarlo
    nuevo_producto = Compra(
        producto=producto,
        cantidad=cantidad,
        fecha_compra=fecha,
        imagen=imagen
    )
    session.add(nuevo_producto)
    session.commit()

    return jsonify({"message": "Producto agregado correctamente.", "error": False})

@app.route('/eliminar_venta', methods=['POST'])
def eliminar_venta():
    data = request.json
    producto = data['producto']
    fecha = data['fecha']
    cantidad = data['cantidad']

    # Buscar la venta específica de Rubén
    venta = session.query(Venta).filter_by(producto=producto, fecha_venta=fecha, cantidad=cantidad, cliente="Rubén").first()

    if venta:
        session.delete(venta)
        session.commit()
        return jsonify({"message": "Venta de Rubén eliminada correctamente."})
    else:
        return jsonify({"message": "Venta no encontrada para Rubén."}), 404



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Railway asigna dinámicamente el puerto
    app.run(host="0.0.0.0", port=port, debug=True)
