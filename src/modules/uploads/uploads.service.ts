import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    subDir?: string,
  ): Promise<{ filename: string; url: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const targetDir = subDir
      ? path.join(this.uploadDir, subDir)
      : this.uploadDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, file.buffer);

    const url = `/uploads/${subDir ? subDir + '/' : ''}${filename}`;
    return { filename, url };
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}
