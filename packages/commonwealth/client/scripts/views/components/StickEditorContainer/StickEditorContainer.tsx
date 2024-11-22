import { useFlag } from 'hooks/useFlag';
import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';

export const StickEditorContainer = (props: CommentEditorProps) => {
  const stickEditor = useFlag('stickyEditor');
  const [focused, setFocused] = useState(false);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  if (!stickEditor) {
    return <CommentEditor {...props} />;
  }

  // FIXME no style props

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        flexGrow: 1,
        zIndex: 100,
        background: 'white',
      }}
    >
      {focused && <CommentEditor {...props} shouldFocus={true} />}

      {!focused && (
        <input
          type="text"
          style={{
            flexGrow: 1,
            padding: '12px',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
            border:
              '1px solid #ccc' /* Optional: makes the input look cleaner */,
            marginBottom: '16px',
            borderRadius: '8px',
          }}
          onFocus={handleFocused}
          placeholder="Comment on thread here..."
        />
      )}
    </div>
  );
};
