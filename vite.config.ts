import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'c-code-runner-middleware',
      configureServer(server) {
        // Middleware 1: List and Scaffold Lessons
        server.middlewares.use('/api/lessons', (req, res) => {
          const lessonsRoot = path.resolve(__dirname, 'lessons');
          if (!fs.existsSync(lessonsRoot)) {
            fs.mkdirSync(lessonsRoot, { recursive: true });
          }

          if (req.method === 'GET') {
            try {
              const dirs = fs.readdirSync(lessonsRoot, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

              const lessonsList = dirs.map(dirName => {
                const lessonJsonPath = path.join(lessonsRoot, dirName, 'lesson.json');
                if (fs.existsSync(lessonJsonPath)) {
                  try {
                    const content = JSON.parse(fs.readFileSync(lessonJsonPath, 'utf8'));
                    return {
                      id: dirName,
                      code: content.code || dirName.split('-')[0].toUpperCase(),
                      title: content.title || dirName,
                      topic: content.course || content.topic || 'Data Structures & Algorithms'
                    };
                  } catch (e) {
                    // fallback
                  }
                }
                return {
                  id: dirName,
                  code: dirName.split('-')[0].toUpperCase(),
                  title: dirName.replace(/^\d+-/, '').replace(/-/g, ' ').toUpperCase(),
                  topic: 'Computer Science'
                };
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ lessons: lessonsList }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { id, title, topic } = JSON.parse(body);
                if (!id || !title) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'id and title are required' }));
                  return;
                }

                // Sanitize folder name
                const sanitizedId = id.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                const targetDir = path.join(lessonsRoot, sanitizedId);
                const codeDir = path.join(targetDir, 'code');

                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir, { recursive: true });

                // 1. Write lesson.json
                const lessonJson = {
                  id: sanitizedId,
                  title,
                  topic: topic || 'Data Structures & Algorithms',
                  course: 'CS 201: Data Structures & Algorithms',
                  author: 'Classroom Teaching Assistant',
                  date: new Date().toISOString().split('T')[0]
                };
                fs.writeFileSync(path.join(targetDir, 'lesson.json'), JSON.stringify(lessonJson, null, 2), 'utf8');

                // 2. Write starter slides.md
                const starterSlides = `# ${title}
:::badge ${topic || 'Lesson Overview'}

Welcome to this lesson on **${title}**.

:::grid
:::card Algorithmic Foundations [tip]
Master theoretical complexity and mathematical bounds:
$$\\mathcal{O}(\\log n) \\quad \\text{vs} \\quad \\mathcal{O}(n)$$
:::
:::card Systems Architecture [info]
Implement robust, pointer-based structures in pure C with zero memory leaks and clean invariants.
:::
:::

:::notes
Introduce the primary motivation and real-world systems applications for this data structure.
:::

---

# Mathematical Analysis & Invariants
:::badge Asymptotics & Bounds

:::card Invariant Definition
Every state transition must preserve our strict structure properties:
$$\\forall v \\in T, \\quad \\text{valid}(v) = \\text{true}$$
:::

:::card Complexity Guarantees [warning]
Under all mutation sequences, operations remain strictly bounded:
$$\\text{Time}: \\mathcal{O}(\\log n) \\qquad \\text{Space}: \\mathcal{O}(n)$$
:::

:::notes
Walk through the mathematical proof and highlight edge cases.
:::

---

# Interactive Simulation Lab
:::badge Live In-Class VisuAlgo

Explore structure mutations, key lookups, and visual operations:

:::visualizer

:::notes
Invite a student to propose an input sequence and predict the state transition before running.
:::

---

# C Source Code Implementation & Native Runner
:::badge Production-Grade C

Interactive C editor with native GCC compilation and test assertions:

:::code

:::notes
Highlight pointer arithmetic, dynamic memory allocation, and memory leak prevention.
:::
`;
                fs.writeFileSync(path.join(targetDir, 'slides.md'), starterSlides, 'utf8');

                // 3. Write starter C files
                const starterHeader = `#ifndef LESSON_H\n#define LESSON_H\n\n// Classroom TA - ${title}\nvoid demo_init(void);\n\n#endif\n`;
                const starterC = `#include <stdio.h>\n#include "lesson.h"\n\nvoid demo_init(void) {\n    printf("Initialized: ${title}\\n");\n}\n`;
                const starterMain = `#include <stdio.h>\n#include "lesson.h"\n\nint main(void) {\n    printf("===========================================\\n");\n    printf("Classroom TA -- ${title}\\n");\n    printf("===========================================\\n");\n    demo_init();\n    return 0;\n}\n`;
                const starterMakefile = `CC = gcc\nCFLAGS = -Wall -Wextra -g\n\ndemo.exe: demo_main.c lesson.c\n\t$(CC) $(CFLAGS) demo_main.c lesson.c -o demo.exe\n`;

                fs.writeFileSync(path.join(codeDir, 'lesson.h'), starterHeader, 'utf8');
                fs.writeFileSync(path.join(codeDir, 'lesson.c'), starterC, 'utf8');
                fs.writeFileSync(path.join(codeDir, 'demo_main.c'), starterMain, 'utf8');
                fs.writeFileSync(path.join(codeDir, 'Makefile'), starterMakefile, 'utf8');

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, lessonId: sanitizedId }));
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          res.statusCode = 405;
          res.end();
        });

        // Middleware 2: Get & Save Slides Markdown
        server.middlewares.use('/api/slides', (req, res) => {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
          const lessonId = parsedUrl.searchParams.get('lessonId') || '01-avl-trees';
          const slidePath = path.resolve(__dirname, 'lessons', lessonId, 'slides.md');

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            if (fs.existsSync(slidePath)) {
              const content = fs.readFileSync(slidePath, 'utf8');
              res.end(JSON.stringify({ content, exists: true }));
            } else {
              res.end(JSON.stringify({ content: '', exists: false }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { content } = JSON.parse(body);
                const dir = path.dirname(slidePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(slidePath, content || '', 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          res.statusCode = 405;
          res.end();
        });

        // Middleware 3: Run C Code
        server.middlewares.use('/api/run-c', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const files = data.files || {};
              const lessonId = data.lessonId || '01-avl-trees';

              const targetDir = path.resolve(__dirname, 'lessons', lessonId, 'code');

              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              // Write files for the target lesson
              for (const [filename, content] of Object.entries(files)) {
                if (typeof content === 'string') {
                  fs.writeFileSync(path.join(targetDir, filename), content, 'utf8');
                }
              }

              // Set compilation and run commands based on lesson
              let compileCmd = 'gcc -Wall -Wextra demo_main.c *.c -o demo.exe';
              let runCmd = '.\\demo.exe';

              if (lessonId === '01-avl-trees') {
                compileCmd = 'gcc -Wall -Wextra demo_main.c avl_tree.c -o demo.exe';
                runCmd = '.\\demo.exe 3';
              } else if (lessonId === '02-hashmaps') {
                compileCmd = 'gcc -Wall -Wextra demo_hashmap.c hashmap.c -o demo.exe';
                runCmd = '.\\demo.exe';
              } else {
                // If demo_main.c exists, compile all .c files in code directory
                const cFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.c')).join(' ');
                compileCmd = `gcc -Wall -Wextra ${cFiles} -o demo.exe`;
              }

              // Step 1: Real GCC Compilation
              exec(compileCmd, { cwd: targetDir }, (compileErr, compileStdout, compileStderr) => {
                if (compileErr) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    phase: 'compilation',
                    exitCode: compileErr.code || 1,
                    output: `$ ${compileCmd}\n\n${compileStderr || compileStdout || compileErr.message}\n\n[GCC COMPILATION FAILED: Exit Code ${compileErr.code || 1}]`,
                    rawError: compileStderr || compileStdout || ''
                  }));
                  return;
                }

                // Step 2: Execution of demo.exe with 5000ms safety timeout
                exec(runCmd, { cwd: targetDir, timeout: 5000 }, (runErr, runStdout, runStderr) => {
                  res.setHeader('Content-Type', 'application/json');
                  if (runErr) {
                    if (runErr.killed) {
                      res.end(JSON.stringify({
                        success: false,
                        phase: 'runtime',
                        exitCode: -1,
                        output: `$ ${compileCmd}\n[Compilation succeeded]\n$ ${runCmd}\n\n[RUNTIME TIMEOUT (5000ms exceeded) - Check for infinite loops in code]`
                      }));
                      return;
                    }
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
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
});
