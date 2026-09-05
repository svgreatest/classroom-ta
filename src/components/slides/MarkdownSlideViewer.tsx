import React from 'react';
import { ParsedSlide, SlideBlock, SlideCard } from '../../engine/slides/markdown-parser';
import { KaTeXMath } from './KaTeXMath';
import { AVLTreeVisualizer } from '../visualizer/AVLTreeVisualizer';
import { HashMapVisualizer } from '../visualizer/HashMapVisualizer';
import { MonacoRunner } from '../editor/MonacoRunner';
import { LessonId } from '../../branding/BrandHeader';
import { 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2,
  BookOpen, 
  Terminal, 
  Code2, 
  Layers,
  Activity,
  GitBranch
} from 'lucide-react';

interface MarkdownSlideViewerProps {
  slide: ParsedSlide;
  lessonId: LessonId;
  hideInteractivePlaceholders?: boolean;
  revealStep?: number;
}

/**
 * Renders inline text containing $...$ or normal text with bold/italics/code
 */
export const FormattedInlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  // Split on inline math $...$
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1);
          return <KaTeXMath key={index} math={math} />;
        }

        // Render inline markdown elements like `code`, **bold**, *italic*
        const formatted = part.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <React.Fragment key={index}>
            {formatted.map((token, tIdx) => {
              if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
                return (
                  <code
                    key={tIdx}
                    className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#141413] border border-[#383733] text-[#cc785c] font-semibold"
                  >
                    {token.slice(1, -1)}
                  </code>
                );
              }
              if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
                return (
                  <strong key={tIdx} className="font-bold text-[#faf6ee]">
                    {token.slice(2, -2)}
                  </strong>
                );
              }
              if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
                return (
                  <em key={tIdx} className="italic text-[#d4cfc5]">
                    {token.slice(1, -1)}
                  </em>
                );
              }
              return token;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export const MarkdownSlideViewer: React.FC<MarkdownSlideViewerProps> = ({
  slide,
  lessonId,
  hideInteractivePlaceholders = false,
  revealStep
}) => {
  const isAVL = lessonId === '01-avl-trees';

  const renderBlock = (block: SlideBlock, index: number, isNested = false): React.ReactNode => {
    // Check reveal step for animation
    const isRevealed = revealStep === undefined || (block.step ? revealStep >= block.step : true);
    const animClass = block.step && !isNested
      ? `transition-all duration-500 transform ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`
      : '';

    switch (block.type) {
      case 'heading': {
        if (block.level === 1) {
          return (
            <h1 key={index} className={`text-4xl lg:text-5xl font-extrabold text-[#faf6ee] tracking-tight font-serif-anthropic my-3 ${animClass}`}>
              <FormattedInlineText text={block.text} />
            </h1>
          );
        }
        if (block.level === 2) {
          return (
            <h2 key={index} className={`text-2xl lg:text-3xl font-bold text-[#faf6ee] flex items-center gap-2.5 font-serif-anthropic mt-6 mb-3 ${animClass}`}>
              <span className="w-1.5 h-6 rounded-full bg-[#cc785c]" />
              <FormattedInlineText text={block.text} />
            </h2>
          );
        }
        return (
          <h3 key={index} className={`text-base lg:text-lg font-semibold text-[#d49b53] font-serif-anthropic mt-4 mb-2 ${animClass}`}>
            <FormattedInlineText text={block.text} />
          </h3>
        );
      }

      case 'paragraph': {
        return (
          <p key={index} className={`text-base lg:text-lg text-[#d4cfc5] leading-relaxed my-2.5 ${animClass}`}>
            <FormattedInlineText text={block.text} />
          </p>
        );
      }

      case 'alert': {
        const variants = {
          note: {
            border: 'border-[#cc785c]/40',
            icon: <Info className="w-4 h-4 text-[#cc785c] flex-shrink-0" />,
            titleColor: 'text-[#cc785c]',
            textColor: 'text-[#d4cfc5]'
          },
          tip: {
            border: 'border-emerald-500/40',
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
            titleColor: 'text-emerald-400',
            textColor: 'text-emerald-200'
          },
          warning: {
            border: 'border-[#d49b53]/40',
            icon: <AlertTriangle className="w-4 h-4 text-[#d49b53] flex-shrink-0" />,
            titleColor: 'text-[#d49b53]',
            textColor: 'text-[#d49b53]'
          },
          caution: {
            border: 'border-rose-500/40',
            icon: <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />,
            titleColor: 'text-rose-400',
            textColor: 'text-rose-200'
          }
        };
        const config = variants[block.variant] || variants.note;

        return (
          <div key={index} className={`border rounded-xl p-5 my-4 bg-[#22221f] shadow-lg ${config.border} ${animClass}`}>
            <div className="flex items-center gap-2 font-semibold text-xs mb-2 font-serif-anthropic">
              {config.icon}
              <span className={`uppercase tracking-wider ${config.titleColor}`}>
                {block.title || block.variant}
              </span>
            </div>
            <div className={`text-xs lg:text-sm leading-relaxed ${config.textColor}`}>
              <FormattedInlineText text={block.text} />
            </div>
          </div>
        );
      }

      case 'math-block': {
        return (
          <div key={index} className={`my-3.5 p-3.5 bg-[#141413] border border-[#383733] rounded-xl overflow-x-auto shadow-inner text-center ${animClass}`}>
            <KaTeXMath block math={block.math} />
          </div>
        );
      }

      case 'grid': {
        return (
          <div key={index} className={`grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 min-h-[190px] ${animClass}`}>
            {block.cards.map((card, cIdx) => {
              const isCardRevealed = revealStep === undefined || (card.step ? revealStep >= card.step : true);
              return (
                <div
                  key={cIdx}
                  className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 shadow-lg transition-all duration-500 transform ${
                    isCardRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  {card.title && (
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold font-serif-anthropic text-[#faf6ee]">
                      {card.variant === 'caution' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                      {card.variant === 'tip' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {card.variant === 'warning' && <AlertTriangle className="w-5 h-5 text-[#d49b53]" />}
                      {(!card.variant || card.variant === 'default' || card.variant === 'info') && <Activity className="w-5 h-5 text-[#cc785c]" />}
                      <span><FormattedInlineText text={card.title} /></span>
                    </div>
                  )}
                  <div className="space-y-2 text-xs lg:text-sm text-[#d4cfc5]">
                    {card.blocks.map((b, bIdx) => renderBlock(b, bIdx, true))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'card': {
        return (
          <div key={index} className={`bg-[#22221f] border border-[#383733] rounded-xl p-5 my-4 shadow-lg ${animClass}`}>
            {block.title && (
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold font-serif-anthropic text-[#faf6ee]">
                {block.variant === 'caution' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                {block.variant === 'tip' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {block.variant === 'warning' && <AlertTriangle className="w-5 h-5 text-[#d49b53]" />}
                {(!block.variant || block.variant === 'default' || block.variant === 'info') && <Activity className="w-5 h-5 text-[#cc785c]" />}
                <span><FormattedInlineText text={block.title} /></span>
              </div>
            )}
            <div className="space-y-2 text-xs lg:text-sm text-[#d4cfc5]">
              {block.blocks.map((b, bIdx) => renderBlock(b, bIdx, true))}
            </div>
          </div>
        );
      }

      case 'code': {
        return (
          <div key={index} className={`my-4 rounded-xl overflow-hidden border border-[#383733] shadow-xl bg-[#141413] ${animClass}`}>
            <div className="px-4 py-1.5 bg-[#181816] border-b border-[#383733] flex items-center justify-between text-[11px] font-mono text-[#9e978c]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>{block.language.toUpperCase() || 'C'}</span>
              </span>
            </div>
            <pre className="p-4 text-xs font-mono text-[#faf6ee] overflow-x-auto leading-relaxed">
              <code>{block.code}</code>
            </pre>
          </div>
        );
      }

      case 'table': {
        return (
          <div key={index} className={`my-4 overflow-x-auto rounded-xl border border-[#383733] shadow-lg ${animClass}`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#141413] text-[#faf6ee] border-b border-[#383733] font-semibold uppercase tracking-wider font-serif-anthropic">
                <tr>
                  {block.headers.map((h, hIdx) => (
                    <th key={hIdx} className="p-3">
                      <FormattedInlineText text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383733]/60 bg-[#181816]">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#22221f] transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-[#d4cfc5]">
                        <FormattedInlineText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'list': {
        return (
          <ul key={index} className={`my-2 space-y-1.5 list-none pl-1 ${animClass}`}>
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-2 text-xs lg:text-sm text-[#d4cfc5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c] mt-2 flex-shrink-0" />
                <span>
                  <FormattedInlineText text={item} />
                </span>
              </li>
            ))}
          </ul>
        );
      }

      case 'visualizer': {
        if (hideInteractivePlaceholders) {
          return (
            <div key={index} className={`my-4 p-4 border border-dashed border-[#cc785c]/40 rounded-xl bg-[#cc785c]/10 text-[#cc785c] text-xs flex items-center justify-between ${animClass}`}>
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#cc785c]" />
                <span><strong>[Visualizer Widget Placeholder]</strong>: Live algorithm visualizer will render here.</span>
              </span>
              <span className="font-mono text-[10px] bg-[#cc785c]/20 px-2 py-0.5 rounded">
                :::visualizer
              </span>
            </div>
          );
        }
        return (
          <div key={index} className={`my-4 border border-[#383733] rounded-xl overflow-hidden shadow-2xl bg-[#181816] min-h-[480px] ${animClass}`}>
            <div className="px-4 py-2 bg-[#141413] border-b border-[#383733] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#cc785c] flex items-center gap-2 font-serif-anthropic">
                <Layers className="w-4 h-4 text-[#cc785c]" />
                <span>Live Interactive VisuAlgo Lab ({isAVL ? 'AVL Tree' : 'Hash Map'})</span>
              </span>
              <span className="text-[11px] font-mono text-[#9e978c]">Embedded in Slide</span>
            </div>
            <div className="p-2">
              {isAVL ? <AVLTreeVisualizer /> : <HashMapVisualizer />}
            </div>
          </div>
        );
      }

      case 'code-runner': {
        if (hideInteractivePlaceholders) {
          return (
            <div key={index} className={`my-4 p-4 border border-dashed border-[#cc785c]/40 rounded-xl bg-[#cc785c]/10 text-[#cc785c] text-xs flex items-center justify-between ${animClass}`}>
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#cc785c]" />
                <span><strong>[Code Runner Placeholder]</strong>: Monaco C editor & GCC 13.2 runner will render here.</span>
              </span>
              <span className="font-mono text-[10px] bg-[#cc785c]/20 px-2 py-0.5 rounded">
                :::code
              </span>
            </div>
          );
        }
        return (
          <div key={index} className={`my-4 border border-[#383733] rounded-xl overflow-hidden shadow-2xl bg-[#181816] min-h-[480px] ${animClass}`}>
            <div className="px-4 py-2 bg-[#141413] border-b border-[#383733] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#cc785c] flex items-center gap-2 font-serif-anthropic">
                <Code2 className="w-4 h-4 text-[#cc785c]" />
                <span>Interactive C Editor & Native GCC 13.2 Runner</span>
              </span>
              <span className="text-[11px] font-mono text-[#9e978c]">Embedded in Slide</span>
            </div>
            <div className="h-[480px]">
              <MonacoRunner lessonId={lessonId} />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="slide-content font-sans-anthropic text-[#faf6ee] select-text">
      {/* Top Topic Badge if present */}
      {slide.badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/30 text-[#cc785c] text-xs font-semibold uppercase tracking-wider mb-4 font-sans-anthropic">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{slide.badge}</span>
        </div>
      )}

      {/* Render all blocks of the slide */}
      <div className="space-y-4">
        {slide.blocks.map((block, idx) => renderBlock(block, idx))}
      </div>
    </div>
  );
};