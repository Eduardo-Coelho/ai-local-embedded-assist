// Function to render text with clickable links

type FormatTextWithLinksProps = {
  text: string;
};

export const FormatTextWithLinks = ({ text }: FormatTextWithLinksProps) => {
  // URL regex pattern to match various types of URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part: string, index: number) => {
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
};
