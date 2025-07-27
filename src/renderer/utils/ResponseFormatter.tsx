import { ModelResponse } from "../types";

export function renderFormattedResponse(response: ModelResponse): JSX.Element[] {
  // Handle the response structure with text, tokens, and time
  const text = typeof response === 'string' ? response : response.text;
  
  // Split by code block markers and process each part
  return text.split(/(\[CODE_BLOCK_\d+\])/).map((part, index) => {
    if (part.startsWith("[CODE_BLOCK_")) {
      // Extract the code block number
      const blockMatch = part.match(/\[CODE_BLOCK_(\d+)\]/);
      if (blockMatch) {
        const blockNumber = blockMatch[1];
        // You might want to store code blocks in a separate structure
        // For now, we'll render it as a styled code block
        return (
          <div key={index} className="code-block-container">
            <div className="code-block-header">
              <span className="code-block-title">Code Block {blockNumber}</span>
            </div>
            <pre className="code-block">
              <code>{part}</code>
            </pre>
          </div>
        );
      }
    }
    
    // Handle regular text with line breaks and clickable links
    return (
      <span key={index} className="text-content">
        {part.split('\n').map((line, lineIndex) => (
          <span key={lineIndex}>
            {renderTextWithLinks(line)}
            {lineIndex < part.split('\n').length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

// Function to render text with clickable links
function renderTextWithLinks(text: string): JSX.Element[] {
  // URL regex pattern to match various types of URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="clickable-link"
          onClick={(e) => {
            e.preventDefault();
            // Open link in default browser
            window.open(part, '_blank');
          }}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// Alternative function for more advanced code formatting
export function renderFormattedResponseWithSyntaxHighlighting(response: ModelResponse): JSX.Element[] {
  const text = typeof response === 'string' ? response : response.text;
  
  return text.split(/(\[CODE_BLOCK_\d+\])/).map((part, index) => {
    if (part.startsWith("[CODE_BLOCK_")) {
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
              <span className="code-block-title">Code Block {blockNumber}</span>
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
        {part.split('\n').map((line, lineIndex) => {
          // Handle numbered lists
          const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
          if (numberedListMatch) {
            return (
              <div key={lineIndex} className="numbered-list-item">
                <span className="list-number">{numberedListMatch[1]}.</span>
                <span className="list-content">
                  {renderTextWithLinks(numberedListMatch[2])}
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
                  {renderTextWithLinks(line.trim().substring(1).trim())}
                </span>
              </div>
            );
          }
          
          // Regular text with clickable links
          return (
            <div key={lineIndex} className="text-line">
              {line ? renderTextWithLinks(line) : '\u00A0'} {/* Use non-breaking space for empty lines */}
            </div>
          );
        })}
      </div>
    );
  });
}