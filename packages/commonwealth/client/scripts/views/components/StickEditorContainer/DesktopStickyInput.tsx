import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const [focused, setFocused] = useState(false);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <div className="DesktopStickyInput">
      {focused && (
        <CommentEditor {...props} shouldFocus={true} onCancel={handleCancel} />
      )}

      {!focused && (
        <input
          className="StickyEditorPendingInput"
          type="text"
          onFocus={handleFocused}
          placeholder="Comment on thread here..."
        />
      )}
    </div>
  );
};
