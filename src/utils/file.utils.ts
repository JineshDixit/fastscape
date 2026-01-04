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
