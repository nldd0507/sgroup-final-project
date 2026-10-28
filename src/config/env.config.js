import "dotenv/config"

export const config = {

    app : {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || "development"
    },

    db : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    }
}