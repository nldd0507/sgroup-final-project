import pool from "../config/db.config.js" 

export const getDbTime = async() => {
    const {rows} = await pool.query("SELECT now() as now");
    return rows[0].now;
}