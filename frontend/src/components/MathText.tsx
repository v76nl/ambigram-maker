import React from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const MathText: React.FC<MathTextProps> = ({ text, className, style }) => {
  if (!text) return null;

  // $$ ... $$ (ブロック数式) と $ ... $ (インライン数式) を分割してパース
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={className} style={style}>
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="math-block"
                style={{
                  display: "block",
                  margin: "0.35rem 0",
                  padding: "0.25rem 0.5rem",
                  background: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "4px",
                  overflowX: "auto",
                  textAlign: "center",
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="math-inline"
                style={{ padding: "0 0.15rem" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
