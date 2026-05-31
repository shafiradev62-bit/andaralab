import React from 'react';

interface MarkdownRendererProps {
  content: string;
  inlineOnly?: boolean;
}

export function MarkdownRenderer({ content, inlineOnly = false }: MarkdownRendererProps) {
  if (!content) return null;

  if (inlineOnly) {
    // Strip leading # symbols for inline rendering (e.g. in titles)
    const cleanContent = content.replace(/^#+\s+/, '');
    return <>{renderInline(cleanContent)}</>;
  }

  // Handle Headings (at the start of the string)
  if (content.startsWith('# ')) {
    return (
      <h1 className="text-[22px] md:text-[26px] font-bold text-gray-900 mt-8 mb-4 leading-tight">
        {renderInline(content.replace('# ', ''))}
      </h1>
    );
  }
  
  if (content.startsWith('## ')) {
    return (
      <h2 className="text-[18px] md:text-[22px] font-bold text-gray-900 mt-7 mb-3 leading-tight">
        {renderInline(content.replace('## ', ''))}
      </h2>
    );
  }

  if (content.startsWith('### ')) {
    return (
      <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 mt-6 mb-2 leading-tight">
        {renderInline(content.replace('### ', ''))}
      </h3>
    );
  }

  // Handle Bullet Points
  if (content.startsWith('* ')) {
    return (
      <div className="flex gap-3 mb-4 pl-1">
        <span className="text-gray-400 mt-1.5">•</span>
        <div className="text-[14.5px] text-gray-700 leading-[1.8]">
          {renderInline(content.replace('* ', ''))}
        </div>
      </div>
    );
  }

  // Default Paragraph
  return (
    <p className="text-[14.5px] text-gray-700 leading-[1.8] mb-5">
      {renderInline(content)}
    </p>
  );
}

/**
 * Basic inline markdown parser for bold and italic
 */
function renderInline(text: string): React.ReactNode[] {
  // Split by bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-gray-900">
          {boldText}
        </strong>
      );
    }
    
    // You can add more inline rules here (e.g., links, italic)
    // For now, keeping it simple as per user request
    
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
