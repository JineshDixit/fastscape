"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../env/envConfig");
exports.default = {
    POSTGRES_DB: {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        userName: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
    },
};
//# sourceMappingURL=dbConfig.js.map