import pg from "pg"
import {config} from "./env.config.js"

const {Pool} = pg;

const pool = new Pool ( {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
});

export default pool;