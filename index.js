import express, {json} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {dirname, join} from 'path';
import { fileURLToPath } from 'url';
import usersRouter from './routes/user-routes.js';
import authRouter from './routes/auth-routes.js';
import fileManagerRouter from './routes/file_manager-routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {credentials: true, origin: process.env.URL || '*'};

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/file_manager', fileManagerRouter);

app.listen(PORT, ()=>console.log(`Server is listening on ${PORT}`))