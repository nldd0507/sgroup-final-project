import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import pool from "../src/config/db.config.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

const run = async() => {
    await pool.query(`
        Create Table if not exists schema_migrations(
            name Text Primary key,
            applied_at timestamptz not null default now()
        )
    `);

    const {rows} = await pool.query("Select name from schema_migrations");

    const applied = new Set(rows.map((r) => r.name));

    const files = (await fs.readdir(migrationsDir))
        .filter((f) => f.endsWith(".sql"))
        .sort();

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
            await client.query("COMMIT");
            console.log(`Applied ${file}`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    console.log("Migrations are up to date");    
}



run()
    .then(() => pool.end())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });