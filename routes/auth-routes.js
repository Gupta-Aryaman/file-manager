import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {jwtTokens} from '../utils/jwt-helpers.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try{
        const {email, password} = req.body;
        const users = await pool.query('SELECT * FROM users WHERE user_email = $1', [email]);

        // invalid email
        if(users.rows.length === 0){
            return res.status(401).json({error: 'Invalid Credentials'});
        }
        
        const validPassword = await bcrypt.compare(password, users.rows[0].user_password);
        
        //invalid password
        if(!validPassword){
            return res.status(401).json({error: 'Invalid Credentials'});
        }
        
        //jwt
        let tokens = jwtTokens(users.rows[0]);
        // res.cookie('refreshToken', tokens.refreshToken, {httpOnly: true});
        res.json(tokens);

    } catch(error){
        res.status(500).json({error: error.message});
    }
})

export default router;