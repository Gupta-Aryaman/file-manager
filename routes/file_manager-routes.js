import express from 'express';
import pool from '../db.js';
import { authticateToken } from '../middleware/authorization.js';

const router = express.Router();



router.post('/create_folder', authticateToken, async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const {folder_name, parent_folder_id} = req.body;
        const newFolder = await pool.query(
            'INSERT INTO folders (folder_name, parent_folder_id, user_id) VALUES ($1, $2, $3) RETURNING *', [folder_name, parent_folder_id, req.user.user_id]);

        res.json({folder: newFolder.rows[0]});
    } catch(error){
        res.status(500).json({error: error.message});
    }
});