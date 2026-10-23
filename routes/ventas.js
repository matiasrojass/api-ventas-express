import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();


router.get('/consolidado', async (req, res) => {
    try {
        const {sucursal, anio} =req.query;
        
        if (!sucursal || !anio) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Debe enviar ambos parámetros'
            });
        }

        //Se ejecuta el sp en bs
        const [rows] = await pool.query('CALL db_ventas_tech(?, ?)', [sucursal, anio]);

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

router.post('/', async (req, res) => {
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

router.get('/:id', async (req, res) => {
    try {
        const id_venta = Number(req.params.id);

        // Ejecutar el SP
        const [rows] = await pool.query('CALL sp_venta_id(?)', [id_venta]);

        // rows[0] contiene el resultado del SELECT
        if (!rows[0] || rows[0].length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `No existe una venta con id ${id_venta}`
            });
        }

        res.status(200).json({
            status: 'success',
            data: rows[0][0]
        });

    } catch (error) {
        console.error('Error en GET /api/v1/ventas/:id:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Error en MySQL' });
    }
});

export default router;