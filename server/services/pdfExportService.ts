import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export interface ExportPdfResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export class PdfExportService {
  private baseDir: string;
  private exportDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.exportDir = path.join(this.baseDir, 'dist', 'exports');
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  public exportLessonToPdf(
    lessonId: string,
    callback: (result: ExportPdfResult) => void
  ): void {
    const lessonSlidePath = path.join(this.baseDir, 'lessons', lessonId, 'slides.md');
    if (!fs.existsSync(lessonSlidePath)) {
      callback({
        success: false,
        error: `Slides for lesson "${lessonId}" do not exist.`
      });
      return;
    }

    const outputFileName = `${lessonId}-slides.pdf`;
    const outputPath = path.join(this.exportDir, outputFileName);
    const relativeSlidePath = `lessons/${lessonId}/slides.md`;
    const relativeOutputPath = `dist/exports/${outputFileName}`;

    // Use npx slidev export with timeout of 60 seconds
    const exportCmd = `npx slidev export "${relativeSlidePath}" --output "${relativeOutputPath}"`;

    console.log(`[PDF Exporting]: Running ${exportCmd}`);

    exec(exportCmd, { cwd: this.baseDir, timeout: 90000 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[PDF Export Error]:`, stderr || err.message);
        callback({
          success: false,
          error: stderr || stdout || err.message
        });
        return;
      }

      if (fs.existsSync(outputPath)) {
        callback({
          success: true,
          filePath: outputPath,
          fileName: outputFileName
        });
      } else {
        callback({
          success: false,
          error: 'PDF export completed but output file was not found.'
        });
      }
    });
  }
}
