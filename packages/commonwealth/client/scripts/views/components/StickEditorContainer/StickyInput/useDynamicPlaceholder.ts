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
 */
export const useDynamicPlaceholder = (props: UseDynamicPlaceholderProps) => {
  const {
    mode,
    isReplying,
    replyingToAuthor,
    isMobile,
    selector = '.quill.sticky-editor .ql-editor',
  } = props;

  const getPlaceholderText = () => {
    if (mode === 'thread') {
      return 'Create a thread...';
    } else if (isReplying) {
      return `Reply to ${replyingToAuthor || ''}...`;
    } else {
      return isMobile ? 'Comment on thread...' : 'Write a comment...';
    }
  };

  const placeholderText = getPlaceholderText();

  useEffect(() => {
    const editorElement = document.querySelector(selector);

    if (editorElement) {
      editorElement.setAttribute('data-placeholder', placeholderText);
    }
  }, [placeholderText, selector]);

  return placeholderText;
};
