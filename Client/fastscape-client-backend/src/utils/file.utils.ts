import fs from 'fs/promises';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '..', '..', 'uploads');

/**
 * Safely resolve a path under BASE_DIR using provided segments.
 * Rejects absolute paths and directory traversal attempts.
 */
function resolveSafePath(...segments: string[]): string {
  if (segments.some((s) => path.isAbsolute(s))) {
    throw new Error('Absolute paths are not allowed');
  }

  const resolved = path.resolve(BASE_DIR, ...segments);

  if (!resolved.startsWith(BASE_DIR + path.sep)) {
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
export const saveFile = async (
  file: Express.Multer.File,
  userId: string,
  docType: string = 'general',
): Promise<string> => {
  if (!file) {
    throw new Error('No file provided');
  }

  const uploadDir = resolveSafePath('documents', userId, docType);

  try {
    await fs.access(uploadDir);
    const files = await fs.readdir(uploadDir);
    for (const f of files) {
      const fileToDelete = resolveSafePath('documents', userId, docType, f);
      await fs.unlink(fileToDelete);
    }
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const fileExt = path.extname(file.originalname);
  const fileName = `${Date.now()}${fileExt}`;
  const filePath = resolveSafePath('documents', userId, docType, fileName);

  await fs.writeFile(filePath, file.buffer);

  return path.join('uploads', 'documents', userId, docType, fileName).replace(/\\/g, '/');
};
