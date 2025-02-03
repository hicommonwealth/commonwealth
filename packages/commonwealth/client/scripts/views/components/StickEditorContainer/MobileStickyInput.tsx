import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { MobileInput } from 'views/components/StickEditorContainer/MobileInput';
import './MobileStickyInput.scss';

/**
 * This mobile version uses a portal to add itself to the bottom nav.
 */
export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment, replyingToAuthor } = props;
  const [focused, setFocused] = useState(false);
  const [useAiStreaming, setUseAiStreaming] = useState(false);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  const customHandleSubmitComment = useCallback(() => {
    setFocused(false);
    handleSubmitComment();
  }, [handleSubmitComment]);

  const parent = document.getElementById('MobileNavigationHead');

  if (!parent) {
    console.warn('No parent container for MobileStickyInput');
    return null;
  }

  if (focused) {
    return (
      <div className="MobileStickyInputFocused">
        <CommentEditor
          {...props}
          shouldFocus={true}
          onCancel={handleCancel}
          useAiStreaming={useAiStreaming}
          setUseAiStreaming={setUseAiStreaming}
          handleSubmitComment={customHandleSubmitComment}
        />
      </div>
    );
  }

  return createPortal(
    <div className="MobileStickyInput">
      <MobileInput
        {...props}
        onFocus={handleFocused}
        useAiStreaming={useAiStreaming}
        setUseAiStreaming={setUseAiStreaming}
      />
    </div>,
    parent,
  );
};
