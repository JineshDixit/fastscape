import express from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Middleware to serve static files with proper headers
 */
export const serveStaticFiles = () => {
  const uploadsPath = path.join(process.cwd(), 'uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  return express.static(uploadsPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set appropriate content type for images
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          res.setHeader('Content-Type', 'image/jpeg');
          break;
        case '.png':
          res.setHeader('Content-Type', 'image/png');
          break;
        case '.webp':
          res.setHeader('Content-Type', 'image/webp');
          break;
        default:
          res.setHeader('Content-Type', 'application/octet-stream');
      }

      // Set cache control headers
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    },
  });
};

/**
 * Middleware to handle image not found
 */
export const handleImageNotFound = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only handle requests to uploads path
  if (req.path.startsWith('/uploads/')) {
    return res.status(404).json({
      success: false,
      message: 'Image not found',
    });
  }
  next();
};
