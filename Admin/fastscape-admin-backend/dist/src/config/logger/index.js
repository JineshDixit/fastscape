"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganMiddleware = exports.logger = void 0;
const logger_config_1 = __importDefault(require("./logger.config"));
exports.logger = logger_config_1.default;
const morgan_config_1 = __importDefault(require("./morgan.config"));
exports.morganMiddleware = morgan_config_1.default;
exports.default = logger_config_1.default;
//# sourceMappingURL=index.js.map