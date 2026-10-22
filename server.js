import express from 'express';
import ventasRoutes from './routes/ventas.js';
import 'dotenv/config';

const app = express();

// 1.

app.use(express.json());

// montamos las rutas el prefijo /api/v1/ventas
app.use('/api/v1/ventas', ventasRoutes);

// 5. Iniciar Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor Express en http://localhost:${PORT}`)
})

