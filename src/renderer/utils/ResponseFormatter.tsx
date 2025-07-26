export interface FormattedResponse {
  text: string;
  hasCode: boolean;
  codeBlocks: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
}

export function formatResponse(rawResponse: string): FormattedResponse {
  // Clean up the response first
  let cleanedResponse = rawResponse
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .trim();

  // If the response seems incomplete or malformed, try to clean it up
  if (cleanedResponse.includes('</div>') || cleanedResponse.includes('</body>')) {
    // Remove any trailing HTML-like content
    cleanedResponse = cleanedResponse.replace(/<\/div>.*$/, '');
    cleanedResponse = cleanedResponse.replace(/<\/body>.*$/, '');
  }

  // Handle the specific formatting issues from your response
  // Split on common question/answer patterns
  cleanedResponse = cleanedResponse.replace(/(###\s*[^#\n]+)/g, '\n\n$1\n\n');
  cleanedResponse = cleanedResponse.replace(/(Question:\s*[^\n]+)/g, '\n\n**$1**\n\n');
  cleanedResponse = cleanedResponse.replace(/(Answer:\s*[^\n]+)/g, '\n\n$1\n\n');
  
  // Handle bullet points and lists
  cleanedResponse = cleanedResponse.replace(/(\s*[-*]\s*[^\n]+)/g, '\n$1');
  
  // Handle code snippets
  cleanedResponse = cleanedResponse.replace(/(`[^`]+`)/g, '\n$1\n');
  
  // Clean up multiple newlines again
  cleanedResponse = cleanedResponse.replace(/\n{3,}/g, '\n\n');

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: CodeBlock[] = [];
  let formattedText = cleanedResponse;
  let blockIndex = 0;

  // Extract code blocks and replace with placeholders
  formattedText = formattedText.replace(codeBlockRegex, (match, language, code) => {
    const lang = language || 'text';
    codeBlocks.push({
      language: lang,
      code: code.trim()
    });
    return `[CODE_BLOCK_${blockIndex++}]`;
  });

  return {
    text: formattedText,
    hasCode: codeBlocks.length > 0,
    codeBlocks
  };
}

export function renderFormattedResponse(response: FormattedResponse): JSX.Element[] {
  const elements: JSX.Element[] = [];
  const parts = response.text.split(/(\[CODE_BLOCK_\d+\])/);

  parts.forEach((part, index) => {
    if (part.startsWith('[CODE_BLOCK_') && part.endsWith(']')) {
      const blockIndex = parseInt(part.match(/\d+/)?.[0] || '0');
      const codeBlock = response.codeBlocks[blockIndex];
      
      if (codeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="code-block">
            <div className="code-header">
              <span className="code-language">{codeBlock.language}</span>
            </div>
            <code>{codeBlock.code}</code>
          </pre>
        );
      }
    } else if (part.trim()) {
      // Split by double newlines to create paragraphs
      const paragraphs = part.split('\n\n').filter(p => p.trim());
      paragraphs.forEach((paragraph, pIndex) => {
        // Check if this is a heading (starts with ###)
        if (paragraph.startsWith('###')) {
          const headingText = paragraph.replace(/^###\s*/, '');
          elements.push(
            <h3 key={`heading-${index}-${pIndex}`} className="response-heading">
              {headingText}
            </h3>
          );
        }
        // Check if this is a question (starts with **Question:)
        else if (paragraph.startsWith('**Question:')) {
          const questionText = paragraph.replace(/^\*\*Question:\s*/, '').replace(/\*\*$/, '');
          elements.push(
            <div key={`question-${index}-${pIndex}`} className="question-block">
              <strong>Question:</strong> {questionText}
            </div>
          );
        }
        // Check if this is an answer (starts with Answer:)
        else if (paragraph.startsWith('Answer:')) {
          const answerText = paragraph.replace(/^Answer:\s*/, '');
          elements.push(
            <div key={`answer-${index}-${pIndex}`} className="answer-block">
              <strong>Answer:</strong> {answerText}
            </div>
          );
        }
        // Check if this looks like a list item
        else if (paragraph.match(/^\s*[-*]\s+/)) {
          const listItems = paragraph.split('\n').filter(item => item.trim());
          elements.push(
            <ul key={`list-${index}-${pIndex}`} className="response-list">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex}>{item.replace(/^\s*[-*]\s+/, '')}</li>
              ))}
            </ul>
          );
        }
        // Regular paragraph
        else {
          elements.push(
            <p key={`text-${index}-${pIndex}`} className="response-paragraph">
              {paragraph}
            </p>
          );
        }
      });
    }
  });

  return elements;
}