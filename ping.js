import pool from "./src/config/db.config.js";

const result = await pool.query("SELECT now() AS now");
console.log(result.rows);
await pool.end();