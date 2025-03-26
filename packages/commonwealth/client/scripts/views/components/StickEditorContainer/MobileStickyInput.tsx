import React, { useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import useSidebarStore from 'state/ui/sidebar/sidebar';
import { useLocalAISettingsStore } from 'state/ui/user';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { CWText } from 'views/components/component_kit/cw_text';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { CommunityCreationForm } from './CommunityCreationForm/CommunityCreationForm';
import { MobileInput } from './MobileInput';
import './MobileStickyInput.scss';
import { StickCommentContext } from './context/StickCommentProvider';

export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment, initialPrompt } = props;
  const [focused, setFocused] = useState(false);
  const { mode } = useContext(StickCommentContext);
  const { aiCommentsToggleEnabled } = useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const menuVisible = useSidebarStore((state) => state.menuVisible);

  const handleCancel = useCallback(() => {
    console.log('MobileStickyInput: handleCancel triggered');
    setFocused(false);
  }, []);

  const handleAiReply = useCallback(
    (commentId: number) => {
      if (streamingReplyIds.includes(commentId)) {
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const customHandleSubmitComment = useCallback(async (): Promise<number> => {
    setFocused(false);

    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('MobileStickyInput - Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
    }

    if (aiCommentsToggleEnabled) {
      handleAiReply(commentId);
    }

    try {
      await listenForComment(commentId, aiCommentsToggleEnabled);
    } catch (error) {
      console.warn('MobileStickyInput - Failed to jump to comment:', error);
    }

    return commentId;
  }, [handleSubmitComment, aiCommentsToggleEnabled, handleAiReply]);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const parent = document.getElementById('MobileNavigationHead');

  if (!parent) {
    console.warn('No parent container for MobileStickyInput');
    return null;
  }

  if (menuVisible) {
    return null;
  }

  // Get title based on mode
  const getEditorTitle = () => {
    if (mode === 'thread') return 'Create Thread';
    if (mode === 'community') return 'Create Community';
    return 'Write Comment';
  };

  if (focused) {
    return (
      <div className="MobileStickyInputFocused">
        <div className="mobile-editor-container">
          <div className="header-row">
            <div className="left-section">
              <CWText type="h4">{getEditorTitle()}</CWText>
            </div>
          </div>

          {mode === 'thread' ? (
            <NewThreadForm onCancel={handleCancel} />
          ) : mode === 'community' ? (
            <CommunityCreationForm
              onCancel={handleCancel}
              initialPrompt={initialPrompt}
              generateOnMount={!!initialPrompt}
            />
          ) : (
            <CommentEditor
              {...props}
              shouldFocus={true}
              onCancel={handleCancel}
              aiCommentsToggleEnabled={aiCommentsToggleEnabled}
              handleSubmitComment={customHandleSubmitComment}
              onAiReply={handleAiReply}
              streamingReplyIds={streamingReplyIds}
            />
          )}
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="MobileStickyInput">
      <MobileInput
        {...props}
        onFocus={handleFocused}
        aiCommentsToggleEnabled={aiCommentsToggleEnabled}
      />
    </div>,
    parent,
  );
};
