import express from 'express';
import pool from '../db.js';
import { authticateToken } from '../middleware/authorization.js';
import dotenv from 'dotenv';
import { S3Client, ListObjectsCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fileUpload from 'express-fileupload';

// const fileUpload = require('express-fileupload');

dotenv.config();


const router = express.Router();
const BUCKET = process.env.AWS_BUCKET_NAME
const s3Client = new S3Client({});
const client = await pool.connect();


// parent folder creation endpoint
router.post('/create_folder', authticateToken, async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const {folder_name} = req.body;
        
        // check if folder already exists for the particular user
        const checkFolder = await pool.query('SELECT * FROM files WHERE file_name = $1 AND file_owner = $2 AND file_path = $3', [folder_name, user_id, "./"]);
        if(checkFolder.rows.length > 0){
            return res.status(401).json({error: 'Folder already exists'});
        }
        
        
        let newFolder;
        try {

            await client.query('BEGIN')
            newFolder = await client.query(
                'INSERT INTO files (file_name, file_path, file_owner, is_folder) VALUES ($1, $2, $3, $4) RETURNING *', [folder_name, "./", user_id, true]);

                const command = new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: newFolder.rows[0].file_id + "/",
                    Body: "folder creation",
                  });

            const response = await s3Client.send(command);
            await client.query('COMMIT')
            
        } catch (err) {
            await client.query('ROLLBACK')
            return res.status(401).json({error: err.message});
        }

        res.json({folder: newFolder.rows[0]});
    } catch(error){
        res.status(500).json({error: error.message});
    }
});


// subfolder creation endpoint
router.post('/create_subfolder', authticateToken, async (req, res) => {
    try{
        const user_id = req.user.user_id;
        const {sub_folder_name} = req.body;
        const {parent_folder_name} = req.body;
        
        // check if parent folder exists or not
        const checkFolder = await pool.query('SELECT * FROM files WHERE file_name = $1 AND file_owner = $2 AND file_path = $3', [parent_folder_name, user_id, "./"]);
        if(checkFolder.rows.length === 0){
            return res.status(401).json({error: 'Parent folder doesn\'t exist'});
        }

        // check if sub folder already exists in the parent folder
        const checkSubFolder = await pool.query('SELECT * FROM files WHERE file_name = $1 AND file_owner = $2 AND file_path = $3', [sub_folder_name, user_id, "./"+parent_folder_name+"/"+sub_folder_name+"/"]);
        if(checkSubFolder.rows.length > 0){
            return res.status(401).json({error: 'Sub folder already exists'});
        }
        
        
        let newFolder;
        try {

            await client.query('BEGIN')
            newFolder = await client.query(
                'INSERT INTO files (file_name, file_path, file_owner, is_folder) VALUES ($1, $2, $3, $4) RETURNING *', [sub_folder_name, "./"+parent_folder_name+"/"+sub_folder_name+"/", user_id, true]);

                const command = new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: checkFolder.rows[0].file_id + "/" + newFolder.rows[0].file_id + "/",
                    Body: "sub folder creation",
                  });

            const response = await s3Client.send(command);
            await client.query('COMMIT')
            
        } catch (err) {
            await client.query('ROLLBACK')
            return res.status(401).json({error: err.message});
        }

        res.json({folder: newFolder.rows[0]});
    } catch(error){
        res.status(500).json({error: error.message});
    }
});


// file upload endpoint
router.use(fileUpload());

router.post('/upload', authticateToken, async function(req, res) {
    let sampleFile;
    let uploadPath;
    const user_id = req.user.user_id;
  
    if (!req.files || Object.keys(req.files).length === 0) {
    console.log(req.files);
      return res.status(400).send('No files were uploaded.');
    }
    
    const {sub_folder_name} = req.body;
    const {parent_folder_name} = req.body;
    const {file_name} = req.body;

    uploadPath = "";
    let normalUploadPath = "./";

    if(parent_folder_name !== "" && parent_folder_name !== undefined){
        // check if parent folder exists or not
        const checkFolder = await pool.query('SELECT * FROM files WHERE file_name = $1 AND file_owner = $2 AND file_path = $3', [parent_folder_name, user_id, "./"]);
        if(checkFolder.rows.length === 0){
            return res.status(401).json({error: 'Parent folder doesn\'t exist'});
        }
        uploadPath = checkFolder.rows[0].file_id+"/";
        normalUploadPath += parent_folder_name+"/";

        if(sub_folder_name !== "" && sub_folder_name !== undefined){
            // check if sub folder exists in the parent folder
            const checkSubFolder = await pool.query('SELECT * FROM files WHERE file_name = $1 AND file_owner = $2 AND file_path = $3', [sub_folder_name, user_id, "./"+parent_folder_name+"/"+sub_folder_name+"/"]);
            if(checkSubFolder.rows.length === 0){
                return res.status(401).json({error: 'Sub folder doesn\'t exist'});
            }
            uploadPath = uploadPath + checkSubFolder.rows[0].file_id +"/";
            normalUploadPath = normalUploadPath + sub_folder_name+"/";
        }

    }

    

    try{

        await client.query('BEGIN')
        let newFile = await client.query(
            'INSERT INTO files (file_name, file_path, file_owner, is_folder) VALUES ($1, $2, $3, $4) RETURNING *', [file_name, normalUploadPath + file_name, user_id, false]);
        
            
        // const fileContent  = req.files.sampleFile;
        const fileContent = Buffer.from(req.files.sampleFile.data, 'binary');

        // Setting up S3 upload parameters
        const params = new PutObjectCommand({
            Bucket: BUCKET,
            Key: uploadPath + newFile.rows[0].file_id, // File name you want to save as in S3
            Body: fileContent 
        });

        
        try {
            const response = await s3Client.send(params);
            await client.query('COMMIT');
            res.json({folder: newFile.rows[0]});

        } catch (err) {
            await client.query('ROLLBACK')
            console.error(err);
            throw err;
        }

        
        

    } catch(error){
        res.status(500).json({error: error.message});
    }
    

  });


export default router;