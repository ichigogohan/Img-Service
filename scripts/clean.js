import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../icons');

if (fs.existsSync(ICONS_DIR)) {
  const files = fs.readdirSync(ICONS_DIR);

  for (const file of files) {
    if (file !== 'default.webp') {
      const filePath = path.join(ICONS_DIR, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
  console.log('Cleaned up all icons except default.webp');
} else {
  console.log('Icons directory does not exist.');
}