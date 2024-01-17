import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { authticateToken } from '../middleware/authorization.js';

const router = express.Router();

router.get('/test', authticateToken, async (req, res) => {
    try{
        const email = req.user.user_email;
        const users = await pool.query('SELECT * FROM users');
        res.json({users: users.rows, email: email});
    } catch(error){
        res.status(500).json({error: error.message});
    }
})

router.post('/signup', async (req, res) => {
    try{
        const users = await pool.query('SELECT * FROM users WHERE user_email = $1', [req.body.email]);
        if(users.rows.length > 0){
            return res.status(401).json({error: 'User already exists'});
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (user_name,user_email, user_password) VALUES ($1, $2, $3) RETURNING *', [req.body.name, req.body.email, hashedPassword]);

        res.json({user: newUser.rows[0]});
    } catch(error){
        res.status(500).json({error: error.message});
    }
})

export default router;