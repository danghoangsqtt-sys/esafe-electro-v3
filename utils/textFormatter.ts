
import React from 'react';

/**
 * Utility để format văn bản hỗ trợ Markdown cơ bản và KaTeX (Toán học/Điện học).
 * Cấu hình { strict: false, throwOnError: false } để hỗ trợ ký tự Unicode (tiếng Việt) trong công thức.
 */
export const formatContent = (text: string): React.ReactNode => {
  if (!text) return null;

  let html = text;

  // 1. Xử lý xuống dòng trước để tránh phá vỡ cấu trúc SVG của KaTeX sau này
  html = html.replace(/\n/g, '<br />');

  // 2. Render KaTeX Display Mode ($$ ... $$)
  html = html.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    try {
      const cleanMath = math.replace(/<br \/>/g, '\n');
      return (window as any).katex.renderToString(cleanMath, { 
        displayMode: true, 
        throwOnError: false,
        strict: false 
      });
    } catch (e) {
      return math;
    }
  });

  // 3. Render KaTeX Inline Mode ($ ... $)
  html = html.replace(/\$(.*?)\$/g, (_, math) => {
    try {
      const cleanMath = math.replace(/<br \/>/g, '\n');
      return (window as any).katex.renderToString(cleanMath, { 
        displayMode: false, 
        throwOnError: false,
        strict: false 
      });
    } catch (e) {
      return math;
    }
  });

  // 4. Markdown cơ bản: Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-inherit">$1</strong>');

  // 5. Markdown cơ bản: Lists
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>');

  return React.createElement('div', {
    className: 'math-content break-words',
    dangerouslySetInnerHTML: { __html: html }
  });
};
