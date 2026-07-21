import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const ICONS_DIR = path.join(__dirname, '../icons');

// CORS 設定
const corsOrigin = process.env.ALLOWED_ORIGINS;
if (corsOrigin) {
  const allowedOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : corsOrigin;

  app.use(cors({ origin: allowedOrigins }));
}


// 保存用ディレクトリの確認・作成
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Multer 設定 (メモリ保存、5MB上限)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// 画像アップロード API
app.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader || typeof userIdHeader !== 'string') {
      res.status(400).end();
      return;
    }

    // パストラバーサル防止（英数字・ハイフン・アンダースコアのみ許可）
    const userId = userIdHeader.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      res.status(400).end();
      return;
    }

    if (!req.file) {
      res.status(400).end();
      return;
    }

    // file-type によるファイルフォーマット検証
    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

    if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
      res.status(400).end();
      return;
    }

    // 512x512 中央正方形トリミング & WebP 変換
    const outputPath = path.join(ICONS_DIR, `${userId}.webp`);
    await sharp(req.file.buffer, { limitInputPixels: 268435456 })
      .resize(512, 512, {
        fit: 'cover',
        position: 'center',
      })
      .webp()
      .toFile(outputPath);

    // 成功時は 204 No Content
    res.status(204).end();
  } catch (error) {
    console.error('Upload process failed:', error);
    res.status(500).end();
  }
});

// アイコン配信 API
app.get('/icons/:filename', (req: Request<{ filename: string }>, res: Response): void => {
  const filename = path.basename(req.params.filename);
  const targetPath = path.join(ICONS_DIR, filename);
  const defaultPath = path.join(ICONS_DIR, 'default.webp');

  if (fs.existsSync(targetPath)) {
    res.sendFile(targetPath);
  } else if (fs.existsSync(defaultPath)) {
    res.sendFile(defaultPath);
  } else {
    res.status(404).end();
  }
});

// ヘルスチェック API
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
});

// Multer エラーハンドリング
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).end();
    return;
  }
  res.status(500).end();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});