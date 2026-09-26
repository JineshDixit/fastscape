"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const morgan_1 = __importDefault(require("morgan"));
const logger_config_1 = __importDefault(require("./logger.config"));
// Stream object for Morgan to write to Winston
const stream = {
    write: (message) => logger_config_1.default.http(message.trim()),
};
// Skip logging during tests
const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'test';
};
// Morgan middleware with custom format
// Format: :method :url :status :res[content-length] - :response-time ms
const morganMiddleware = (0, morgan_1.default)(':method :url :status :res[content-length] - :response-time ms', { stream, skip });
exports.default = morganMiddleware;
//# sourceMappingURL=morgan.config.js.map