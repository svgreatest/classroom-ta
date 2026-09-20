import fs from 'fs';
import path from 'path';

export interface CodeExampleFile {
  name: string;
  relativePath: string;
  category: string;
  sizeBytes: number;
}

export interface CodeExampleCategory {
  category: string;
  files: CodeExampleFile[];
}

export class CodeExamplesService {
  private examplesRoot: string;

  constructor(examplesRoot: string) {
    this.examplesRoot = examplesRoot;
    if (!fs.existsSync(this.examplesRoot)) {
      fs.mkdirSync(this.examplesRoot, { recursive: true });
    }
  }

  public listCategories(): CodeExampleCategory[] {
    const results: CodeExampleCategory[] = [];
    if (!fs.existsSync(this.examplesRoot)) return results;

    const entries = fs.readdirSync(this.examplesRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryDir = path.join(this.examplesRoot, entry.name);
        const files = fs.readdirSync(categoryDir, { withFileTypes: true })
          .filter(f => f.isFile() && (f.name.endsWith('.c') || f.name.endsWith('.h') || f.name.endsWith('.md')))
          .map(f => {
            const filePath = path.join(categoryDir, f.name);
            const stats = fs.statSync(filePath);
            return {
              name: f.name,
              relativePath: `${entry.name}/${f.name}`,
              category: entry.name,
              sizeBytes: stats.size
            };
          });

        results.push({
          category: entry.name,
          files
        });
      }
    }
    return results;
  }

  public getFileContent(relativePath: string): { content: string; exists: boolean } {
    const fullPath = path.join(this.examplesRoot, relativePath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return { content: fs.readFileSync(fullPath, 'utf8'), exists: true };
    }
    return { content: '', exists: false };
  }

  public saveFileContent(relativePath: string, content: string): boolean {
    const fullPath = path.join(this.examplesRoot, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  }
}
