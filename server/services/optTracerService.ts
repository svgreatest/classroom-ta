import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import type { IncomingMessage, ServerResponse } from 'http';

export class OptTracerService {
  private baseDir: string;
  private tracerScript: string;
  private optRoot: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.tracerScript = path.join(this.baseDir, 'server/c_gdb_tracer.py');
    this.optRoot = path.join(this.baseDir, 'OnlinePythonTutor/v5-unity');
  }

  public parseTracerOutput(stdout: string, stderr: string, userCode: string): any {
    const jsonStart = stdout.indexOf('{');
    const jsonEnd = stdout.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        return JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));
      } catch (e) {
        // ignore
      }
    }
    return {
      code: userCode,
      trace: [{
        event: 'uncaught_exception',
        exception_msg: stderr || stdout || 'Error parsing tracer execution output',
        line: 1
      }]
    };
  }

  public executeTracer(userCode: string, callback: (traceObj: any) => void): void {
    const tempFile = path.join(this.baseDir, `server/temp_${Date.now()}_${Math.random().toString(36).substring(2)}.c`);
    fs.writeFileSync(tempFile, userCode, 'utf8');

    exec(`python "${this.tracerScript}" "${tempFile}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }, (err, stdout, stderr) => {
      try { fs.unlinkSync(tempFile); } catch {}
      const traceObj = this.parseTracerOutput(stdout, stderr, userCode);
      callback(traceObj);
    });
  }

  public handleStaticTutor(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    let reqPath = (req.url || '/').split('?')[0];
    if (reqPath.startsWith('/opt-tutor')) {
      reqPath = reqPath.slice('/opt-tutor'.length);
    }
    if (reqPath === '/' || reqPath === '') reqPath = '/c.html';
    const filePath = path.join(this.optRoot, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.json': 'application/json',
        '.svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    next();
  }
}
