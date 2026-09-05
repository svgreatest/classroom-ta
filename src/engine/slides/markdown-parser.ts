/**
 * Classroom TA - Markdown Slide Parser & KaTeX Preprocessor
 */

export interface ParsedSlide {
  id: number;
  raw: string;
  badge?: string;
  title?: string;
  notes?: string;
  hasVisualizer: boolean;
  hasCodeRunner: boolean;
  maxSteps: number;
  blocks: SlideBlock[];
}

export interface SlideCard {
  title?: string;
  variant?: 'default' | 'caution' | 'tip' | 'warning' | 'info';
  step?: number;
  content: string;
  blocks: SlideBlock[];
}

export type SlideBlock = 
  | { type: 'heading'; level: number; text: string; step?: number }
  | { type: 'paragraph'; text: string; step?: number }
  | { type: 'alert'; variant: 'note' | 'tip' | 'warning' | 'caution'; title?: string; text: string; step?: number }
  | { type: 'code'; language: string; code: string; step?: number }
  | { type: 'math-block'; math: string; step?: number }
  | { type: 'table'; headers: string[]; rows: string[][]; step?: number }
  | { type: 'list'; items: string[]; step?: number }
  | { type: 'visualizer'; step?: number }
  | { type: 'code-runner'; step?: number }
  | { type: 'grid'; cards: SlideCard[]; step?: number }
  | { type: 'card'; title?: string; variant?: 'default' | 'caution' | 'tip' | 'warning' | 'info'; blocks: SlideBlock[]; step?: number };

/**
 * Splits raw markdown into individual slide chunks using '---' as delimiter.
 */
export function splitSlides(markdown: string): string[] {
  if (!markdown || !markdown.trim()) return [''];
  return markdown.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Parses an individual slide chunk into structured blocks.
 */
export function parseSlide(raw: string, slideIndex: number): ParsedSlide {
  const lines = raw.split(/\r?\n/);
  const blocks: SlideBlock[] = [];
  let badge: string | undefined;
  let title: string | undefined;
  let notes: string | undefined;
  let hasVisualizer = false;
  let hasCodeRunner = false;
  let currentStep = 0;
  let maxSteps = 0;

  let inNotes = false;
  const notesLines: string[] = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  const codeLines: string[] = [];

  let inMathBlock = false;
  const mathLines: string[] = [];

  let inTable = false;
  const tableLines: string[] = [];

  let inList = false;
  const listItems: string[] = [];

  let inAlert = false;
  let alertVariant: 'note' | 'tip' | 'warning' | 'caution' = 'note';
  let alertTitle = '';
  const alertLines: string[] = [];

  // Card & Grid state
  let inGrid = false;
  const gridCards: SlideCard[] = [];

  let inCard = false;
  let currentCardTitle = '';
  let currentCardVariant: 'default' | 'caution' | 'tip' | 'warning' | 'info' = 'default';
  let currentCardLines: string[] = [];
  let currentCardStep: number | undefined;

  const flushTable = () => {
    if (tableLines.length >= 2) {
      const headers = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
      const rows: string[][] = [];
      for (let i = 2; i < tableLines.length; i++) {
        const rowCells = tableLines[i].split('|').map(c => c.trim()).filter(Boolean);
        if (rowCells.length > 0) rows.push(rowCells);
      }
      blocks.push({ type: 'table', headers, rows, step: currentStep > 0 ? currentStep : undefined });
    }
    tableLines.length = 0;
    inTable = false;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: [...listItems], step: currentStep > 0 ? currentStep : undefined });
      listItems.length = 0;
    }
    inList = false;
  };

  const flushAlert = () => {
    if (inAlert) {
      blocks.push({
        type: 'alert',
        variant: alertVariant,
        title: alertTitle || undefined,
        text: alertLines.join('\n'),
        step: currentStep > 0 ? currentStep : undefined
      });
      alertLines.length = 0;
      alertTitle = '';
      inAlert = false;
    }
  };

  const parseCardContent = (rawCardContent: string): SlideBlock[] => {
    // Parse nested content inside a card
    const cardSlide = parseSlide(rawCardContent, 0);
    return cardSlide.blocks;
  };

  const flushCard = () => {
    if (inCard) {
      const cardContent = currentCardLines.join('\n').trim();
      const cardBlocks = parseCardContent(cardContent);
      const cardObj: SlideCard = {
        title: currentCardTitle || undefined,
        variant: currentCardVariant,
        step: currentCardStep,
        content: cardContent,
        blocks: cardBlocks
      };

      if (inGrid) {
        gridCards.push(cardObj);
      } else {
        blocks.push({
          type: 'card',
          title: cardObj.title,
          variant: cardObj.variant,
          blocks: cardBlocks,
          step: cardObj.step
        });
      }

      currentCardLines = [];
      currentCardTitle = '';
      currentCardVariant = 'default';
      currentCardStep = undefined;
      inCard = false;
    }
  };

  const flushGrid = () => {
    flushCard();
    if (inGrid) {
      if (gridCards.length > 0) {
        // Automatically assign sequential steps to cards in grid if not specified
        gridCards.forEach((c, idx) => {
          if (c.step === undefined) {
            maxSteps = Math.max(maxSteps, idx + 1);
            c.step = idx + 1;
          } else {
            maxSteps = Math.max(maxSteps, c.step);
          }
        });

        blocks.push({
          type: 'grid',
          cards: [...gridCards],
          step: currentStep > 0 ? currentStep : undefined
        });
        gridCards.length = 0;
      }
      inGrid = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Speaker Notes Block (:::notes ... :::)
    if (trimmed.startsWith(':::notes')) {
      inNotes = true;
      continue;
    }
    if (inNotes) {
      if (trimmed === ':::') {
        inNotes = false;
        notes = notesLines.join('\n').trim();
      } else {
        notesLines.push(line);
      }
      continue;
    }

    // 2. Step Directive (:::step ... :::)
    if (trimmed.startsWith(':::step')) {
      currentStep++;
      maxSteps = Math.max(maxSteps, currentStep);
      continue;
    }

    // 3. Grid Directive (:::grid ... :::)
    if (trimmed.startsWith(':::grid') || trimmed.startsWith(':::columns')) {
      flushList();
      flushTable();
      flushAlert();
      inGrid = true;
      continue;
    }

    // 4. Card Directive (:::card [Title] [variant])
    if (trimmed.startsWith(':::card')) {
      if (inCard) flushCard();
      inCard = true;
      const cardHeader = trimmed.replace(':::card', '').trim();
      // Check for variant tag e.g. [caution], [tip], [warning], [info]
      const variantMatch = cardHeader.match(/\[(caution|tip|warning|info|default)\]/i);
      if (variantMatch) {
        currentCardVariant = variantMatch[1].toLowerCase() as any;
      }
      currentCardTitle = cardHeader.replace(/\[(caution|tip|warning|info|default)\]/i, '').trim();
      if (currentStep > 0) {
        currentCardStep = currentStep;
      }
      continue;
    }

    // Closing ::: for Card, Grid, or Step
    if (trimmed === ':::') {
      if (inCard) {
        flushCard();
        continue;
      } else if (inGrid) {
        flushGrid();
        continue;
      } else if (currentStep > 0) {
        // Closed a step
        continue;
      }
    }

    // If inside a card, accumulate card lines
    if (inCard) {
      currentCardLines.push(line);
      continue;
    }

    // 5. Code Blocks (```c ... ```)
    if (trimmed.startsWith('```')) {
      flushList();
      flushTable();
      flushAlert();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim() || 'c';
        codeLines.length = 0;
      } else {
        inCodeBlock = false;
        blocks.push({
          type: 'code',
          language: codeLanguage,
          code: codeLines.join('\n'),
          step: currentStep > 0 ? currentStep : undefined
        });
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 6. Block Math ($$ ... $$)
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      flushList();
      flushTable();
      flushAlert();
      blocks.push({
        type: 'math-block',
        math: trimmed.slice(2, -2).trim(),
        step: currentStep > 0 ? currentStep : undefined
      });
      continue;
    }
    if (trimmed === '$$') {
      flushList();
      flushTable();
      flushAlert();
      if (!inMathBlock) {
        inMathBlock = true;
        mathLines.length = 0;
      } else {
        inMathBlock = false;
        blocks.push({
          type: 'math-block',
          math: mathLines.join('\n').trim(),
          step: currentStep > 0 ? currentStep : undefined
        });
      }
      continue;
    }
    if (inMathBlock) {
      mathLines.push(line);
      continue;
    }

    // 7. Special Placeholders: :::visualizer & :::code
    if (trimmed === ':::visualizer') {
      flushList();
      flushTable();
      flushAlert();
      hasVisualizer = true;
      blocks.push({ type: 'visualizer', step: currentStep > 0 ? currentStep : undefined });
      continue;
    }
    if (trimmed === ':::code' || trimmed === ':::code-runner') {
      flushList();
      flushTable();
      flushAlert();
      hasCodeRunner = true;
      blocks.push({ type: 'code-runner', step: currentStep > 0 ? currentStep : undefined });
      continue;
    }

    // 8. Badge directive: :::badge Text
    if (trimmed.startsWith(':::badge')) {
      badge = trimmed.replace(':::badge', '').trim();
      continue;
    }

    // 9. Alerts: > [!NOTE], > [!WARNING], > [!CAUTION], > [!TIP]
    if (trimmed.startsWith('> [!')) {
      flushList();
      flushTable();
      flushAlert();
      const match = trimmed.match(/>\s*\[!(NOTE|TIP|WARNING|CAUTION)\](?:\s*(.*))?/i);
      if (match) {
        inAlert = true;
        alertVariant = match[1].toLowerCase() as any;
        alertTitle = match[2] ? match[2].trim() : '';
        alertLines.length = 0;
        continue;
      }
    }
    if (inAlert) {
      if (trimmed.startsWith('>')) {
        alertLines.push(trimmed.replace(/^>\s?/, ''));
        continue;
      } else if (trimmed === '') {
        alertLines.push('');
        continue;
      } else {
        flushAlert();
      }
    }

    // 10. Headings (# Title, ## Section, ### Sub)
    if (trimmed.startsWith('#')) {
      flushList();
      flushTable();
      flushAlert();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        if (level === 1 && !title) {
          title = text;
        }
        blocks.push({
          type: 'heading',
          level,
          text,
          step: currentStep > 0 ? currentStep : undefined
        });
        continue;
      }
    }

    // 11. Markdown Tables (| Col1 | Col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushAlert();
      inTable = true;
      tableLines.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 12. Standalone LaTeX expression detection (e.g. \text{BF}(u) = ... or N(h) = ...)
    if (/^\\(text|alpha|frac|mathcal|sum|log|prod|sqrt|mathbf|theta|Omega)/i.test(trimmed) || 
        (/^[A-Za-z0-9_]+\s*=\s*\\/.test(trimmed) && trimmed.includes('\\'))) {
      flushList();
      flushTable();
      flushAlert();
      blocks.push({
        type: 'math-block',
        math: trimmed,
        step: currentStep > 0 ? currentStep : undefined
      });
      continue;
    }

    // 13. Bullet lists (- item or * item)
    if (/^[-*]\s+/.test(trimmed)) {
      flushTable();
      flushAlert();
      inList = true;
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    } else if (inList && trimmed !== '') {
      flushList();
    }

    // 14. Normal Paragraphs
    if (trimmed.length > 0) {
      flushList();
      flushTable();
      flushAlert();
      blocks.push({
        type: 'paragraph',
        text: trimmed,
        step: currentStep > 0 ? currentStep : undefined
      });
    }
  }

  flushList();
  flushTable();
  flushAlert();
  flushGrid();

  return {
    id: slideIndex,
    raw,
    badge,
    title,
    notes,
    hasVisualizer,
    hasCodeRunner,
    maxSteps,
    blocks
  };
}

/**
 * Parse an entire markdown file into an array of ParsedSlide objects.
 */
export function parseAllSlides(markdown: string): ParsedSlide[] {
  const rawSlides = splitSlides(markdown);
  if (rawSlides.length === 0) {
    return [parseSlide('# Untitled Slide\n\nWelcome to Classroom TA', 0)];
  }
  return rawSlides.map((raw, idx) => parseSlide(raw, idx));
}
