import fs from 'fs';
import path from 'path';

export interface LessonItem {
  id: string;
  code: string;
  title: string;
  topic: string;
}

export interface TutorExample {
  id: string;
  title: string;
  category: 'lesson' | 'gate_quiz';
  code: string;
}

export class LessonService {
  private lessonsRoot: string;

  constructor(lessonsRoot: string) {
    this.lessonsRoot = lessonsRoot;
    if (!fs.existsSync(this.lessonsRoot)) {
      fs.mkdirSync(this.lessonsRoot, { recursive: true });
    }
  }

  public getLessons(): LessonItem[] {
    try {
      const dirs = fs.readdirSync(this.lessonsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      return dirs.map(dirName => {
        const lessonJsonPath = path.join(this.lessonsRoot, dirName, 'lesson.json');
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
    } catch (err) {
      console.error('Error fetching lessons:', err);
      return [];
    }
  }

  public createLesson(id: string, title: string, topic?: string): { success: boolean; lessonId: string } {
    const sanitizedId = id.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const targetDir = path.join(this.lessonsRoot, sanitizedId);
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

    // 2. Starter Slidev slide markdown
    const starterSlides = `---
theme: default
title: ${title}
info: ${topic || 'Lesson Overview'}
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
---

# ${title}

<div class="opacity-80 text-sm font-mono mt-2">${topic || 'Lesson Overview'}</div>

<div class="mt-8 grid grid-cols-2 gap-4 text-left">
  <div class="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
    <div class="font-bold text-emerald-400">Algorithmic Foundations</div>
    <div class="text-xs text-gray-300 mt-1">Theoretical complexity and invariants</div>
    <div class="mt-2 text-center text-sm font-mono">$\\mathcal{O}(\\log n) \\quad \\text{vs} \\quad \\mathcal{O}(n)$</div>
  </div>
  <div class="p-4 rounded-lg bg-sky-950/30 border border-sky-500/30">
    <div class="font-bold text-sky-400">Systems Architecture</div>
    <div class="text-xs text-gray-300 mt-1">Pointer implementations in pure C</div>
    <div class="mt-2 text-center text-sm font-mono">0 Memory Leaks</div>
  </div>
</div>

<!-- notes -->
Introduce the primary motivation and real-world systems applications.

---

# Mathematical Invariants

Every state transition preserves our strict invariant:

$$\\forall v \\in T, \\quad \\text{valid}(v) = \\text{true}$$

<div class="mt-6 p-4 rounded bg-amber-950/20 border border-amber-500/30">
  <div class="font-semibold text-amber-400">Complexity Bounds</div>
  <div class="text-xs text-gray-300 mt-1">Time: $\\mathcal{O}(\\log n)$ | Space: $\\mathcal{O}(n)$</div>
</div>

<!-- notes -->
Walk through invariant proofs and pointer edge cases.
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

    return { success: true, lessonId: sanitizedId };
  }

  public getSlides(lessonId: string): { content: string; exists: boolean } {
    const slidePath = path.join(this.lessonsRoot, lessonId, 'slides.md');
    if (fs.existsSync(slidePath)) {
      return { content: fs.readFileSync(slidePath, 'utf8'), exists: true };
    }
    return { content: '', exists: false };
  }

  // C Tutor demos shipped with a lesson: lessons/<id>/tutor/<example-id>.c.
  // An optional first line "// Title: ..." names the demo; "quiz_*" files are understanding checks.
  public getTutorExamples(lessonId: string): TutorExample[] {
    if (!/^[\w-]+$/.test(lessonId)) return [];
    const tutorDir = path.join(this.lessonsRoot, lessonId, 'tutor');
    if (!fs.existsSync(tutorDir)) return [];

    return fs.readdirSync(tutorDir)
      .filter(name => name.endsWith('.c'))
      .sort()
      .map(name => {
        const id = name.slice(0, -2);
        const code = fs.readFileSync(path.join(tutorDir, name), 'utf8');
        const titleMatch = code.match(/^\/\/\s*Title:\s*(.+)$/m);
        return {
          id,
          title: titleMatch ? titleMatch[1].trim() : id.replace(/_/g, ' '),
          category: id.startsWith('quiz_') ? 'gate_quiz' as const : 'lesson' as const,
          code
        };
      });
  }

  public saveSlides(lessonId: string, content: string): boolean {
    const slidePath = path.join(this.lessonsRoot, lessonId, 'slides.md');
    const dir = path.dirname(slidePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(slidePath, content || '', 'utf8');
    return true;
  }
}
