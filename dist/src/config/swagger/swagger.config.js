"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOpenApiDocument = void 0;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OPENAPI_PATH = path.join(process.cwd(), 'src/docs/openapi');
const loadOpenApiDocument = () => {
    const rootFile = path.join(OPENAPI_PATH, 'index.yaml');
    const rootDoc = yaml.load(fs.readFileSync(rootFile, 'utf8'));
    // Initialize components and paths if not present
    rootDoc.components = rootDoc.components || {};
    rootDoc.components.schemas = rootDoc.components.schemas || {};
    rootDoc.paths = rootDoc.paths || {};
    // Load schemas
    const schemaDir = path.join(OPENAPI_PATH, 'components/schemas');
    if (fs.existsSync(schemaDir)) {
        const schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.yaml'));
        schemaFiles.forEach((file) => {
            const content = yaml.load(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
            Object.assign(rootDoc.components.schemas, content);
        });
    }
    // Load paths
    const pathsDir = path.join(OPENAPI_PATH, 'paths');
    if (fs.existsSync(pathsDir)) {
        const pathFiles = fs.readdirSync(pathsDir).filter((f) => f.endsWith('.yaml'));
        pathFiles.forEach((file) => {
            const content = yaml.load(fs.readFileSync(path.join(pathsDir, file), 'utf8'));
            Object.assign(rootDoc.paths, content);
        });
    }
    return rootDoc;
};
exports.loadOpenApiDocument = loadOpenApiDocument;
//# sourceMappingURL=swagger.config.js.map