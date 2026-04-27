import { AIModelResponse } from '../../services';
import { FormatTextWithLinks } from './formatTextWithLinks';

type FormatResponseProps = {
  response: AIModelResponse;
};

// Alternative function for more advanced code formatting
export const FormatResponse = ({ response }: FormatResponseProps) => {
  const text = typeof response === 'string' ? response : response.text;

  return text
    .split(/(\[CODE_BLOCK_\d+\])/)
    .map((part: string, index: number) => {
      if (part.startsWith('[CODE_BLOCK_')) {
        const blockMatch = part.match(/\[CODE_BLOCK_(\d+)\]/);
        if (blockMatch) {
          const blockNumber = blockMatch[1];
          return (
            <div key={index} className="code-block-wrapper">
              <div className="code-block-header">
                <div className="code-block-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="code-block-title">
                  Code Block {blockNumber}
                </span>
              </div>
              <div className="code-block-content">
                <pre className="code-block">
                  <code>{part}</code>
                </pre>
              </div>
            </div>
          );
        }
      }

      // Handle regular text with proper formatting and clickable links
      return (
        <div key={index} className="text-content">
          {part.split('\n').map((line: string, lineIndex: number) => {
            // Handle numbered lists
            const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
            if (numberedListMatch) {
              return (
                <div key={lineIndex} className="numbered-list-item">
                  <span className="list-number">{numberedListMatch[1]}.</span>
                  <span className="list-content">
                    <FormatTextWithLinks text={numberedListMatch[2]} />
                  </span>
                </div>
              );
            }

            // Handle bullet points
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              return (
                <div key={lineIndex} className="bullet-list-item">
                  <span className="bullet">•</span>
                  <span className="list-content">
                    <FormatTextWithLinks
                      text={line.trim().substring(1).trim()}
                    />
                  </span>
                </div>
              );
            }

            // Regular text with clickable links
            return (
              <div key={lineIndex} className="text-line">
                {line ? <FormatTextWithLinks text={line} /> : '\u00A0'}{' '}
                {/* Use non-breaking space for empty lines */}
              </div>
            );
          })}
        </div>
      );
    });
};
