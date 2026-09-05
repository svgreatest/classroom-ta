import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXMathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KaTeXMath: React.FC<KaTeXMathProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'html', // Omit duplicate MathML output so text never repeats
      });
    } catch (e) {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`inline-block ${block ? 'my-2 block text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
