import { useState, useEffect, useRef, memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StreamMarkdownProps {
  content: string;
  speed?: number; // ms per char
}

export const StreamMarkdown = memo(({ content, speed = 10 }: StreamMarkdownProps) => {
  // Initialize with full content. 
  // For new messages, content is empty, so displayed is empty.
  // For history messages, content is full, so displayed is full (no typing effect).
  const [displayedContent, setDisplayedContent] = useState(content);
  const targetRef = useRef(content);
  
  // Update target ref when content changes
  useEffect(() => {
    targetRef.current = content;
  }, [content]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedContent((prev) => {
        // If target content was reset (e.g. cleared), reset displayed content
        if (targetRef.current.length < prev.length) {
          return targetRef.current;
        }

        // If caught up, do nothing
        if (prev.length >= targetRef.current.length) {
          return prev;
        }

        // Calculate step size based on remaining distance to ensure we catch up
        const remaining = targetRef.current.length - prev.length;
        // If backlog is large, speed up.
        // Dynamic speed: the more text pending, the faster we type.
        // This prevents the "never catching up" issue with fast LLMs.
        const step = Math.max(1, Math.ceil(remaining / 10)); 
        
        return targetRef.current.slice(0, prev.length + step);
      });
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  return <MarkdownRenderer content={displayedContent} />;
});

StreamMarkdown.displayName = 'StreamMarkdown';
