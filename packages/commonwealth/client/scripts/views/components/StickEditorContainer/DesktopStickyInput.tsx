import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import './DesktopStickyInput.scss';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor } = props;
  const [focused, setFocused] = useState(false);
  const { handleSubmitComment } = props;

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

  const placeholder = isReplying
    ? `Replying to ${replyingToAuthor} ...`
    : `Comment on thread here...`;

  return (
    <div className="DesktopStickyInput">
      {focused && (
        <CommentEditor
          {...props}
          shouldFocus={true}
          onCancel={handleCancel}
          handleSubmitComment={customHandleSubmitComment}
        />
      )}

      {!focused && (
        <input
          className="DesktopStickyInputPending"
          type="text"
          onFocus={handleFocused}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};
