import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/usuarios.js';
import solicitudesRouter from './routes/solicitudes.js';
import authRouter from './routes/auth.js';
import notificacionesRouter from './routes/notificaciones.js';

// Load env vars regardless of where node is executed from.
// 1) repo root: servicio-comunitario/.env
// 2) backend folder: servicio-comunitario/backend/.env
dotenv.config({ path: new URL('../.env', import.meta.url) });
dotenv.config({ path: new URL('./.env', import.meta.url) });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json());

// --- ROUTES ---

// Health check endpoint (good practice)
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/usuarios', usersRouter);
app.use('/api/solicitudes', solicitudesRouter);
app.use('/api/auth', authRouter);
app.use('/api/notificaciones', notificacionesRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});