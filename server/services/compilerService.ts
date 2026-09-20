import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export interface CompileResult {
  success: boolean;
  phase: 'compilation' | 'runtime' | 'complete';
  exitCode: number;
  output: string;
  rawError?: string;
}

export class CompilerService {
  private lessonsRoot: string;
  private examplesRoot: string;

  constructor(lessonsRoot: string, examplesRoot: string) {
    this.lessonsRoot = lessonsRoot;
    this.examplesRoot = examplesRoot;
  }

  public runLessonCode(
    lessonId: string,
    files: Record<string, string>,
    callback: (result: CompileResult) => void
  ): void {
    const targetDir = path.join(this.lessonsRoot, lessonId, 'code');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write updated files
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        fs.writeFileSync(path.join(targetDir, filename), content, 'utf8');
      }
    }

    let compileCmd = 'gcc -Wall -Wextra demo_main.c *.c -o demo.exe';
    let runCmd = '.\\demo.exe';

    if (lessonId === '01-avl-trees') {
      compileCmd = 'gcc -Wall -Wextra demo_main.c avl_tree.c -o demo.exe';
      runCmd = '.\\demo.exe 3';
    } else if (lessonId === '02-hashmaps') {
      compileCmd = 'gcc -Wall -Wextra demo_hashmap.c hashmap.c -o demo.exe';
      runCmd = '.\\demo.exe';
    } else if (lessonId === '03-pointers-and-stacks') {
      compileCmd = 'gcc -Wall -Wextra demo_main.c int_stack.c generic_stack.c -o demo.exe';
      runCmd = '.\\demo.exe';
    } else {
      const cFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.c')).join(' ');
      compileCmd = `gcc -Wall -Wextra ${cFiles || 'demo_main.c'} -o demo.exe`;
    }

    this.executeCompileAndRun(compileCmd, runCmd, targetDir, callback);
  }

  public runExampleCode(
    relativeFilePath: string,
    callback: (result: CompileResult) => void
  ): void {
    const fullPath = path.join(this.examplesRoot, relativeFilePath);
    if (!fs.existsSync(fullPath)) {
      callback({
        success: false,
        phase: 'compilation',
        exitCode: 1,
        output: `File not found: ${relativeFilePath}`
      });
      return;
    }

    const dir = path.dirname(fullPath);
    const fileName = path.basename(fullPath);
    const exeName = `${path.parse(fileName).name}_example.exe`;
    const compileCmd = `gcc -Wall -Wextra "${fileName}" -o "${exeName}"`;
    const runCmd = `.\\${exeName}`;

    this.executeCompileAndRun(compileCmd, runCmd, dir, callback);
  }

  private executeCompileAndRun(
    compileCmd: string,
    runCmd: string,
    cwd: string,
    callback: (result: CompileResult) => void
  ): void {
    exec(compileCmd, { cwd }, (compileErr, compileStdout, compileStderr) => {
      if (compileErr) {
        callback({
          success: false,
          phase: 'compilation',
          exitCode: compileErr.code || 1,
          output: `$ ${compileCmd}\n\n${compileStderr || compileStdout || compileErr.message}\n\n[GCC COMPILATION FAILED: Exit Code ${compileErr.code || 1}]`,
          rawError: compileStderr || compileStdout || ''
        });
        return;
      }

      exec(runCmd, { cwd, timeout: 5000 }, (runErr, runStdout, runStderr) => {
        if (runErr) {
          if (runErr.killed) {
            callback({
              success: false,
              phase: 'runtime',
              exitCode: -1,
              output: `$ ${compileCmd}\n[Compilation succeeded]\n$ ${runCmd}\n\n[RUNTIME TIMEOUT (5000ms exceeded) - Check for infinite loops in code]`
            });
            return;
          }
          callback({
            success: false,
            phase: 'runtime',
            exitCode: runErr.code || 1,
            output: `$ ${compileCmd}\n[Compilation succeeded]\n$ ${runCmd}\n\n${runStdout}\n${runStderr}\n[PROCESS CRASHED / EXITED WITH CODE ${runErr.code || 1}]`
          });
          return;
        }

        callback({
          success: true,
          phase: 'complete',
          exitCode: 0,
          output: `$ ${compileCmd}\n[GCC: Build Succeeded with 0 errors]\n$ ${runCmd}\n\n${runStdout}${runStderr ? `\n[stderr]: ${runStderr}` : ''}`
        });
      });
    });
  }
}
