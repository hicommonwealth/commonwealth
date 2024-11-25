import { useFlag } from 'hooks/useFlag';
import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';

export const StickyEditorContainer = (props: CommentEditorProps) => {
  const stickEditor = useFlag('stickyEditor');
  const [focused, setFocused] = useState(false);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  if (!stickEditor) {
    return <CommentEditor {...props} />;
  }

  return (
    <div className="StickyEditorContainer">
      {focused && <CommentEditor {...props} shouldFocus={true} />}

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
