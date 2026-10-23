import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/v1/productos?categoria=...&nombre=...  (ambos filtros opcionales)
router.get('/', async (req, res) => {
    try {
        const { categoria, nombre } = req.query;

        const [rows] = await pool.query('CALL sp_listar_productos(?, ?)', [
            categoria || null,
            nombre || null
        ]);

        res.status(200).json({
            status: 'success',
            total_registros: rows[0] ? rows[0].length : 0,
            data: rows[0]
        });

    } catch (error) {
        console.error('Error en GET /api/v1/productos:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Error en MySQL' });
    }
});

// POST /api/v1/productos
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion, categoria, precio } = req.body;
        const stock = req.body.stock ?? 0;

        if (typeof nombre !== 'string' || nombre.trim() === '' || precio === undefined || precio === null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Los campos nombre y precio son obligatorios'
            });
        }

        if (nombre.trim().length > 150) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'El nombre no puede superar los 150 caracteres'
            });
        }

        if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'El precio debe ser un numero mayor o igual a 0'
            });
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'El stock debe ser un entero mayor o igual a 0'
            });
        }

        const [rows] = await pool.query('CALL sp_registrar_producto(?, ?, ?, ?, ?)', [
            nombre.trim(),
            descripcion || null,
            categoria || null,
            precio,
            stock
        ]);

        const id_producto = rows[0][0].id_producto;

        res.status(201).json({
            status: 'success',
            message: 'Producto registrado exitosamente',
            datos_registrados: { id_producto, nombre: nombre.trim(), descripcion, categoria, precio, stock }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Ya existe un producto con ese nombre'
            });
        }
        console.error('Error en POST /api/v1/productos:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Error en MySQL' });
    }
});

export default router;