import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import './DesktopStickyInput.scss';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel } = props;
  const [focused, setFocused] = useState(false);
  const { handleSubmitComment } = props;

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(
    (event: React.MouseEvent) => {
      setFocused(false);
      onCancel(event);
    },
    [onCancel],
  );

  const customHandleSubmitComment = useCallback(() => {
    setFocused(false);
    handleSubmitComment();
  }, [handleSubmitComment]);

  const placeholder = isReplying
    ? `Replying to ${replyingToAuthor} ...`
    : `Comment on thread here...`;

  const useExpandedEditor = focused || isReplying;

  return (
    <div className="DesktopStickyInput">
      {useExpandedEditor && (
        <CommentEditor
          {...props}
          shouldFocus={true}
          onCancel={handleCancel}
          handleSubmitComment={customHandleSubmitComment}
        />
      )}

      {!useExpandedEditor && (
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
