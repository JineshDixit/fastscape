import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

  // Define upload directory: uploads/documents/{userId}/{docType}
  const uploadDir = path.join(process.cwd(), 'uploads', 'documents', userId, docType);

  // Ensure directory exists and CLEAN it (re-upload logic)
  try {
    await fs.access(uploadDir);
    // If it exists, remove existing files to prevent duplicates
    const files = await fs.readdir(uploadDir);
    for (const f of files) {
      await fs.unlink(path.join(uploadDir, f));
    }
  } catch {
    // If it doesn't exist, create it
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename to avoid cache issues but keep structure clean
  const fileExt = path.extname(file.originalname);
  const fileName = `${Date.now()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  // Write file to disk
  await fs.writeFile(filePath, file.buffer);

  // Return relative path (for database storage)
  // Converting backslashes to forward slashes for consistency
  return path.join('uploads', 'documents', userId, docType, fileName).replace(/\\/g, '/');
};
