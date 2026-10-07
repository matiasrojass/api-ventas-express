import express from 'express';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const app = express();

// 1.

app.use(express.json());

// 2. Pool de conexion a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

app.get('/api/v1/ventas/consolidado', async (req, res) => {
    try {
        const {sucursal, anio} =req.query;
        
        if (!sucursal || !anio) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Debe enviar ambos parámetros'
            });
        }

        //Se ejecuta el sp en bs
        const [rows] = await pool.query('CALL db_ventas_tech(?, ?', [sucursal, anio]);

        //Enviamos la respuesta al cliente 
        res.status(200).json({
            status: 'success',
            total_registros: rows[0] ? rows[0].length : 0,
            data: rows[0]
        })

    } catch (error) {
        console.error('Error en GET /api/v1/ventas/consolidado:', error);
        res.status(500).json({error: 'Internal Server Error', message: 'Error en MySQL'})
    }
});

app.post('/api/v1/ventas', async (req, res) => {
    try {
        const {id_producto, id_cliente, cantidad, fecha_venta} = req.body;
        // Validar datos

        if (!id_producto || !id_cliente || !cantidad || !fecha_venta) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Todos los parametros son obligatorios'
            })
        }

        // Insertar datos en la base de datos
        await pool.query('CALL db_registrar_venta(?, ?, ?, ?)',[
            id_producto, id_cliente, cantidad, fecha_venta
        ]);

        // respuesta 201 created
        res.status(201).json({
            status: 'success',
            message: 'Venta registrada exitosamente',
            datos_registrados: {id_producto, id_cliente, cantidad, fecha_venta}
        })
    } catch(error) {
        console.log('Error en POST /ventas:', error);
        res.status(500).json({error: 'Internal Server Error', message: 'Error en MySQL'})
    }
});

// 5. Iniciar Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Servidor Express en http://localhost:$(PORT)')
})
