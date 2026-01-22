import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save an uploaded file from memory to disk
 * @param file The multer file object
 * @param subDir The subdirectory within 'uploads' to save the file
 * @returns The relative path to the saved file
 */
export const saveFile = async (file: Express.Multer.File, subDir: string = 'documents'): Promise<string> => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Define upload directory
  const uploadDir = path.join(process.cwd(), 'uploads', subDir);

  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  // Write file to disk
  await fs.writeFile(filePath, file.buffer);

  // Return relative path (for database storage)
  // Converting backslashes to forward slashes for consistency
  return path.join('uploads', subDir, fileName).replace(/\\/g, '/');
};

/**
 * Delete a file from disk
 * @param relativePath The relative path of the file to delete (e.g., 'uploads/documents/...')
 */
export const deleteFile = async (relativePath: string): Promise<void> => {
  if (!relativePath) return;

  const absolutePath = path.join(process.cwd(), relativePath);

  try {
    await fs.access(absolutePath);
    await fs.unlink(absolutePath);
  } catch (err) {
    // If file doesn't exist or can't be deleted, just log and continue
    // (We don't want to break the whole process if a file is already missing)
  }
};
