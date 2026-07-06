import React from 'react';

interface MarkdownRendererProps {
  content: string;
  inlineOnly?: boolean;
}

export function MarkdownRenderer({ content, inlineOnly = false }: MarkdownRendererProps) {
  if (!content) return null;

  if (inlineOnly) {
    const cleanContent = content.replace(/^#+\s+/, '');
    return <>{renderInline(cleanContent)}</>;
  }

  if (content.startsWith('# ')) {
    return (
      <h1 className="text-[22px] md:text-[26px] font-bold text-foreground mt-8 mb-4 leading-tight">
        {renderInline(content.replace('# ', ''))}
      </h1>
    );
  }
  
  if (content.startsWith('## ')) {
    return (
      <h2 className="text-[18px] md:text-[22px] font-bold text-foreground mt-7 mb-3 leading-tight">
        {renderInline(content.replace('## ', ''))}
      </h2>
    );
  }

  if (content.startsWith('### ')) {
    return (
      <h3 className="text-[16px] md:text-[18px] font-bold text-foreground mt-6 mb-2 leading-tight">
        {renderInline(content.replace('### ', ''))}
      </h3>
    );
  }

  // Bullet: * item or - item
  if (content.startsWith('* ') || content.startsWith('- ')) {
    const text = content.replace(/^(\*|-)\s+/, '');
    return (
      <div className="flex gap-3 mb-4 pl-1">
        <span className="text-muted-foreground mt-1.5">•</span>
        <div className="text-[14.5px] text-foreground/90 leading-[1.8]">
          {renderInline(text)}
        </div>
      </div>
    );
  }

  // Numbered: 1. item
  const numberedMatch = content.match(/^(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return (
      <div className="flex gap-3 mb-4 pl-1">
        <span className="text-muted-foreground mt-1.5 font-medium min-w-[1.25rem]">{numberedMatch[1]}.</span>
        <div className="text-[14.5px] text-foreground/90 leading-[1.8]">
          {renderInline(numberedMatch[2])}
        </div>
      </div>
    );
  }

  // Alphabetical: a. item or A. item
  const alphaMatch = content.match(/^([a-zA-Z])\.\s+(.*)$/);
  if (alphaMatch) {
    return (
      <div className="flex gap-3 mb-4 pl-1">
        <span className="text-muted-foreground mt-1.5 font-medium min-w-[1.25rem]">{alphaMatch[1].toLowerCase()}.</span>
        <div className="text-[14.5px] text-foreground/90 leading-[1.8]">
          {renderInline(alphaMatch[2])}
        </div>
      </div>
    );
  }

  return (
    <p className="text-[14.5px] text-foreground/90 leading-[1.8] mb-5">
      {renderInline(content)}
    </p>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-foreground">
          {boldText}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
