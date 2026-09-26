"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const BASE_DIR = path_1.default.resolve(__dirname, '..', '..', 'uploads');
/**
 * Safely resolve a path under BASE_DIR using provided segments.
 * Rejects absolute paths and directory traversal attempts.
 */
function resolveSafePath(...segments) {
    if (segments.some((s) => path_1.default.isAbsolute(s))) {
        throw new Error('Absolute paths are not allowed');
    }
    const resolved = path_1.default.resolve(BASE_DIR, ...segments);
    if (!resolved.startsWith(BASE_DIR + path_1.default.sep)) {
        throw new Error('Path traversal is not allowed');
    }
    return resolved;
}
/**
 * Save an uploaded file from memory to disk with a deterministic structure
 * @param file The multer file object
 * @param userId The user ID to scope the storage
 * @param docType The document type (e.g., 'driverLicenseFront')
 * @returns The relative path to the saved file
 */
const saveFile = (file_1, userId_1, ...args_1) => __awaiter(void 0, [file_1, userId_1, ...args_1], void 0, function* (file, userId, docType = 'general') {
    if (!file) {
        throw new Error('No file provided');
    }
    const uploadDir = resolveSafePath('documents', userId, docType);
    try {
        yield promises_1.default.access(uploadDir);
        const files = yield promises_1.default.readdir(uploadDir);
        for (const f of files) {
            const fileToDelete = resolveSafePath('documents', userId, docType, f);
            yield promises_1.default.unlink(fileToDelete);
        }
    }
    catch (_a) {
        yield promises_1.default.mkdir(uploadDir, { recursive: true });
    }
    const fileExt = path_1.default.extname(file.originalname);
    const fileName = `${Date.now()}${fileExt}`;
    const filePath = resolveSafePath('documents', userId, docType, fileName);
    yield promises_1.default.writeFile(filePath, file.buffer);
    return path_1.default.join('uploads', 'documents', userId, docType, fileName).replace(/\\/g, '/');
});
exports.saveFile = saveFile;
//# sourceMappingURL=file.utils.js.map