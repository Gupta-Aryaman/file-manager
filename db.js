import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const {Pool} = pg;

let localPoolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
};

const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL, 
    ssl:{rejectUnauthorized: false}
} : localPoolConfig;

const pool = new Pool(poolConfig);
export default pool;