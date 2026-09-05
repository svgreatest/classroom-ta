import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const TARGET_DIR = path.resolve(__dirname, '../lessons/01-avl-trees/code');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/run-c' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const files = data.files || {};
        const lessonId = data.lessonId || '01-avl-trees';
        const isHashMap = lessonId === '02-hashmaps';

        const targetDir = path.resolve(
          __dirname,
          isHashMap ? '../lessons/02-hashmaps/code' : '../lessons/01-avl-trees/code'
        );

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        for (const [filename, content] of Object.entries(files)) {
          if (typeof content === 'string') {
            fs.writeFileSync(path.join(targetDir, filename), content, 'utf8');
          }
        }

        const compileCmd = isHashMap
          ? 'gcc -Wall -Wextra demo_hashmap.c hashmap.c -o demo.exe'
          : 'gcc -Wall -Wextra demo_main.c avl_tree.c -o demo.exe';

        const runCmd = isHashMap ? '.\\demo.exe' : '.\\demo.exe 3';

        exec(compileCmd, { cwd: targetDir }, (compileErr, compileStdout, compileStderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          if (compileErr) {
            res.end(JSON.stringify({
              success: false,
              phase: 'compilation',
              exitCode: compileErr.code || 1,
              output: `$ ${compileCmd}\n\n${compileStderr || compileStdout || compileErr.message}\n\n[GCC COMPILATION FAILED: Exit Code ${compileErr.code || 1}]`,
              rawError: compileStderr || compileStdout || ''
            }));
            return;
          }

          exec(runCmd, { cwd: targetDir, timeout: 5000 }, (runErr, runStdout, runStderr) => {
            if (runErr) {
              res.end(JSON.stringify({
                success: false,
                phase: 'runtime',
                exitCode: runErr.code || 1,
                output: `$ ${compileCmd}\n[Compilation succeeded]\n$ ${runCmd}\n\n${runStdout}\n${runStderr}\n[PROCESS CRASHED / EXITED WITH CODE ${runErr.code || 1}]`
              }));
              return;
            }

            res.end(JSON.stringify({
              success: true,
              phase: 'complete',
              exitCode: 0,
              output: `$ ${compileCmd}\n[GCC: Build Succeeded with 0 errors]\n$ ${runCmd}\n\n${runStdout}${runStderr ? `\n[stderr]: ${runStderr}` : ''}`
            }));
          });
        });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Classroom TA C-Runner standalone daemon listening on http://localhost:${PORT}`);
});
