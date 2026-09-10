import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifySupabaseToken } from '../middleware/supabaseAuth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadRouter = Router();

/**
 * POST /api/upload/image
 * Converts incoming dataUrl / base64 image or raw buffer into a clean .jpg file
 * and saves it to data/uploads/<filename>.jpg
 */
uploadRouter.post('/image', verifySupabaseToken, async (req, res) => {
  try {
    const { image, filename: customName, type = 'photo' } = req.body || {};
    const userId = req.body?.userId || req.user?.uid || req.uid || 'local_authenticated_dev_user';

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing image data (expected base64 or data URL)' });
    }

    // Extract raw base64 data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = image;

    if (matches && matches.length === 3) {
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const safePrefix = type.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const filename = customName
      ? `${customName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '')}_${timestamp}.jpg`
      : `${safePrefix}_${cleanUserId}_${timestamp}_${randomHex}.jpg`;

    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    return res.status(200).json({
      success: true,
      message: 'Image successfully converted and saved as .jpg',
      url: relativeUrl,
      filename,
      sizeBytes: buffer.length,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save image file',
      message: err.message,
    });
  }
});

export default uploadRouter;
