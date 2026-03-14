import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Ejemplo con Supabase:
        const { data, error } = await supabase.from('usuarios').select('id').limit(1);
        if (error) throw error;
        res.status(200).send('Backend y DB activos');
    } catch (err) {
        res.status(500).send('Error conectando a la DB');
    }
});

export default router;
