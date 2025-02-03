import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import './DesktopStickyInput.scss';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel } = props;
  const [focused, setFocused] = useState(false);
  const [useAiStreaming, setUseAiStreaming] = useState(false);

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

  const useExpandedEditor = focused || isReplying;

  return (
    <div className="DesktopStickyInput">
      {!useExpandedEditor ? (
        <div className="DesktopStickyInputCollapsed">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #E5E5E5',
              cursor: 'text',
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder={
                replyingToAuthor
                  ? `Reply to ${replyingToAuthor}...`
                  : 'Write a comment...'
              }
              onClick={handleFocused}
              style={{
                width: '100%',
                border: 'none',
                padding: '0',
                background: 'transparent',
                outline: 'none',
              }}
            />
            <div
              style={{
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CWToggle
                checked={useAiStreaming}
                onChange={() => setUseAiStreaming(!useAiStreaming)}
                icon="sparkle"
                size="small"
                iconColor="#757575"
              />
              <span style={{ fontSize: '12px', color: '#757575' }}>AI</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="DesktopStickyInputExpanded">
          <CommentEditor
            {...props}
            shouldFocus={true}
            onCancel={handleCancel}
            useAiStreaming={useAiStreaming}
            setUseAiStreaming={setUseAiStreaming}
          />
        </div>
      )}
    </div>
  );
};
