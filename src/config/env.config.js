import "dotenv/config"

const required = (name) => {
    if (!process.env[name]) throw new Error(`Missing env: ${name}`);
    return process.env[name];
};

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
        accessSecret: required("JWT_ACCESS_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    },
}