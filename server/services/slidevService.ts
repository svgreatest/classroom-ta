import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess, execSync } from 'child_process';

export class SlidevService {
  private baseDir: string;
  private slidevDir: string;
  private rootSlidesPath: string;
  private currentLessonId: string = '01-avl-trees';
  private slidevProcess: ChildProcess | null = null;
  private port: number = 3030;
  private isStarting: boolean = false;

  constructor(baseDir: string, port = 3030) {
    this.baseDir = baseDir;
    this.slidevDir = path.join(this.baseDir, 'slidev');
    if (!fs.existsSync(this.slidevDir)) {
      fs.mkdirSync(this.slidevDir, { recursive: true });
    }
    this.rootSlidesPath = path.join(this.slidevDir, 'slides.md');
    this.port = port;
  }

  public killPort(port: number): void {
    if (process.platform === 'win32') {
      try {
        const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const lines = out.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && parseInt(pid, 10) > 0 && parseInt(pid, 10) !== process.pid) {
              try {
                execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
              } catch {}
            }
          }
        }
      } catch {}
    }
  }

  public waitForReady(port: number, timeoutMs = 12000): Promise<boolean> {
    const startTime = Date.now();
    return new Promise(resolve => {
      const check = () => {
        if (Date.now() - startTime > timeoutMs) {
          return resolve(false);
        }
        const req = http.get(`http://localhost:${port}/`, res => {
          if (res.statusCode && res.statusCode < 400) {
            resolve(true);
          } else {
            setTimeout(check, 250);
          }
        });
        req.on('error', () => {
          setTimeout(check, 250);
        });
        req.setTimeout(1000, () => {
          req.destroy();
          setTimeout(check, 250);
        });
      };
      check();
    });
  }

  public async setLessonAsync(lessonId: string): Promise<{ success: boolean; lessonId: string }> {
    if (this.currentLessonId === lessonId && this.slidevProcess) {
      const ready = await this.waitForReady(this.port, 2000);
      if (ready) {
        return { success: true, lessonId };
      }
    }

    this.currentLessonId = lessonId;
    console.log(`[SlidevService] Switching slide deck to ${lessonId}...`);
    this.stopSlidev();
    this.killPort(this.port);

    await new Promise(r => setTimeout(r, 400));
    this.startSlidev();

    const isReady = await this.waitForReady(this.port, 12000);
    console.log(`[SlidevService] Slidev ready for ${lessonId}: ${isReady}`);
    return { success: isReady, lessonId };
  }

  public setLesson(lessonId: string): { success: boolean; lessonId: string } {
    this.setLessonAsync(lessonId).catch(console.error);
    return { success: true, lessonId };
  }

  public getCurrentLessonId(): string {
    return this.currentLessonId;
  }

  public getSlidevPort(): number {
    return this.port;
  }

  public startSlidev(): void {
    if (this.slidevProcess) return;

    this.killPort(this.port);

    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const targetSlide = `../lessons/${this.currentLessonId}/slides.md`;
    console.log(`[SlidevService] Launching Slidev pointing to: ${targetSlide} on port ${this.port}`);
    
    this.slidevProcess = spawn(
      npxCmd,
      ['slidev', targetSlide, '--port', String(this.port), '--remote', '--open', 'false', '--force'],
      {
        cwd: this.slidevDir,
        shell: true,
        stdio: 'pipe'
      }
    );

    this.slidevProcess.stdout?.on('data', data => {
      const msg = data.toString();
      if (msg.includes('http://localhost') || msg.includes('public slide show')) {
        console.log(`[Slidev Server Ready]: ${msg.trim()}`);
      }
    });

    this.slidevProcess.stderr?.on('data', () => {});

    this.slidevProcess.on('exit', (code) => {
      console.log(`Slidev process exited with code ${code}`);
      this.slidevProcess = null;
    });
  }

  public stopSlidev(): void {
    if (this.slidevProcess) {
      if (process.platform === 'win32' && this.slidevProcess.pid) {
        try {
          execSync(`taskkill /F /T /PID ${this.slidevProcess.pid}`, { stdio: 'ignore' });
        } catch {
          this.slidevProcess.kill();
        }
      } else {
        this.slidevProcess.kill();
      }
      this.slidevProcess = null;
    }
  }
}
