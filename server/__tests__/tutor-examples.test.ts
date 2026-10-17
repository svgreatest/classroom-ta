import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LessonService } from '../services/lessonService';
import { mergeExamples } from '../../src/components/visualizer/PointersOPTVisualizer';

describe('LessonService.getTutorExamples', () => {
  let root: string;
  let service: LessonService;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'ta-lessons-'));
    const tutorDir = path.join(root, '05-demo', 'tutor');
    fs.mkdirSync(tutorDir, { recursive: true });
    fs.writeFileSync(path.join(tutorDir, 'b_basics.c'), '// Title: Pointer basics\nint main(){return 0;}\n');
    fs.writeFileSync(path.join(tutorDir, 'quiz_pop_order.c'), 'int main(){return 0;}\n');
    fs.writeFileSync(path.join(tutorDir, 'notes.md'), '# not a demo');
    fs.mkdirSync(path.join(root, '06-empty'));
    service = new LessonService(root);
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('lists .c files with titles and categories', () => {
    const examples = service.getTutorExamples('05-demo');
    expect(examples.map(e => e.id)).toEqual(['b_basics', 'quiz_pop_order']);
    expect(examples[0]).toMatchObject({ title: 'Pointer basics', category: 'lesson' });
    expect(examples[1]).toMatchObject({ title: 'quiz pop order', category: 'gate_quiz' });
    expect(examples[0].code).toContain('int main');
  });

  it('returns an empty list when the lesson has no tutor folder', () => {
    expect(service.getTutorExamples('06-empty')).toEqual([]);
    expect(service.getTutorExamples('99-missing')).toEqual([]);
  });

  it('rejects ids that could escape the lessons folder', () => {
    expect(service.getTutorExamples('../05-demo')).toEqual([]);
    expect(service.getTutorExamples('05-demo/../..')).toEqual([]);
  });
});

describe('mergeExamples', () => {
  const builtIn = [
    { id: 'basics', title: 'old basics', code: 'old' },
    { id: 'swap', title: 'swap', code: 'swap' },
  ];

  it('puts lesson demos first and lets them replace built-ins with the same id', () => {
    const merged = mergeExamples([{ id: 'basics', title: 'new basics', code: 'new' }], builtIn);
    expect(merged.map(x => x.id)).toEqual(['basics', 'swap']);
    expect(merged[0].code).toBe('new');
  });

  it('falls back to the built-in presets when the lesson has none', () => {
    expect(mergeExamples([], builtIn)).toEqual(builtIn);
  });
});
