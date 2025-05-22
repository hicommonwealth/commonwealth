import { useEffect } from 'react';

interface UseDynamicPlaceholderProps {
  mode: 'thread' | 'comment';
  isReplying?: boolean;
  replyingToAuthor?: string;
  isMobile?: boolean;
  selector?: string;
}

/**
 * Custom hook to handle dynamic placeholder text for Quill editor
 *
 * @param props - Configuration object containing mode, isReplying, replyingToAuthor, and isMobile
 * @returns The placeholder text string
 */
export const useDynamicPlaceholder = (props: UseDynamicPlaceholderProps) => {
  const {
    mode,
    isReplying,
    replyingToAuthor,
    isMobile,
    selector = '.quill.sticky-editor .ql-editor', // Default selector for the Quill editor
  } = props;

  // Calculate the placeholder text based on current state
  const getPlaceholderText = () => {
    if (mode === 'thread') {
      return 'Create a thread...';
    } else if (isReplying) {
      return `Reply to ${replyingToAuthor || ''}...`;
    } else {
      return isMobile ? 'Comment on thread...' : 'Write a comment...';
    }
  };

  // Current placeholder text
  const placeholderText = getPlaceholderText();

  // Update the placeholder whenever relevant props change
  useEffect(() => {
    // Find the editor element using the selector
    const editorElement = document.querySelector(selector);

    // Only update if we found the element
    if (editorElement) {
      editorElement.setAttribute('data-placeholder', placeholderText);
    }
  }, [placeholderText, selector]);

  return placeholderText;
};
