
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/usuarios.js';
import solicitudesRouter from './routes/solicitudes.js';
import authRouter from './routes/auth.js';

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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});