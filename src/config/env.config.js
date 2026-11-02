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
    },
    jwt: {
        secret: process.env.JWT_SECRET || "default_jwt_secret_key",
        accessSecret: process.env.JWT_ACCESS_SECRET || "default_access_secret",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "2d",
    },
}