import { describe, it, expect } from 'vitest';
import { splitSlides, parseSlide, parseAllSlides } from '../markdown-parser';

describe('Markdown Slide Parser', () => {
  it('splits slides correctly by three dashes', () => {
    const raw = "# Slide 1\nContent 1\n\n---\n\n# Slide 2\nContent 2";
    const slides = splitSlides(raw);
    expect(slides.length).toBe(2);
    expect(slides[0]).toContain('# Slide 1');
    expect(slides[1]).toContain('# Slide 2');
  });

  it('parses titles, badges, and notes correctly', () => {
    const slideMd = "# AVL Tree Invariant\n:::badge Lesson 01\nHere is a paragraph with math: $BF = 0$.\n\n:::notes\nSpeaker notes for the instructor.\n:::\n";
    const parsed = parseSlide(slideMd, 0);
    expect(parsed.title).toBe('AVL Tree Invariant');
    expect(parsed.badge).toBe('Lesson 01');
    expect(parsed.notes).toBe('Speaker notes for the instructor.');
  });

  it('detects visualizer and code-runner placeholders', () => {
    const slideMd = "# Interactive Demo\n:::visualizer\n\n---\n\n# C Code\n:::code\n";
    const slides = parseAllSlides(slideMd);
    expect(slides[0].hasVisualizer).toBe(true);
    expect(slides[0].hasCodeRunner).toBe(false);
    expect(slides[1].hasCodeRunner).toBe(true);
    expect(slides[1].hasVisualizer).toBe(false);
  });

  it('parses GitHub alerts', () => {
    const slideMd = "# Warning\n> [!CAUTION] Critical Issue\n> Do not dereference null pointers!\n";
    const parsed = parseSlide(slideMd, 0);
    const alertBlock = parsed.blocks.find(b => b.type === 'alert');
    expect(alertBlock).toBeDefined();
    if (alertBlock && alertBlock.type === 'alert') {
      expect(alertBlock.variant).toBe('caution');
      expect(alertBlock.title).toBe('Critical Issue');
      expect(alertBlock.text).toContain('Do not dereference null pointers!');
    }
  });

  it('parses markdown tables correctly', () => {
    const slideMd = "| Case | Rotation |\n| --- | --- |\n| LL | Right |\n| RR | Left |\n";
    const parsed = parseSlide(slideMd, 0);
    const tableBlock = parsed.blocks.find(b => b.type === 'table');
    expect(tableBlock).toBeDefined();
    if (tableBlock && tableBlock.type === 'table') {
      expect(tableBlock.headers).toEqual(['Case', 'Rotation']);
      expect(tableBlock.rows.length).toBe(2);
      expect(tableBlock.rows[0]).toEqual(['LL', 'Right']);
    }
  });
});
