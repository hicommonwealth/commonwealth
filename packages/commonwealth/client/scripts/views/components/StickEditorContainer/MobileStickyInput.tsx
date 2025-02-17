import React, { useCallback, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useLocalAISettingsStore } from 'state/ui/user';
import useSidebarStore from 'state/ui/sidebar/sidebar';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { MobileInput } from './MobileInput';
import { StickCommentContext } from './context/StickCommentProvider';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileStickyInput.scss';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';

export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment } = props;
  const [focused, setFocused] = useState(false);
  const { mode } = useContext(StickCommentContext);
  const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
    useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const menuVisible = useSidebarStore((state) => state.menuVisible);
  const { generateComment } = useGenerateCommentText();

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

  const handleAiGenerate = useCallback(async (text: string) => {
    try {
      const generatedText = await generateComment(text, (update) => {
        console.log('AI generation update:', update);
      });
      return generatedText;
    } catch (error) {
      console.error('Failed to generate AI text:', error);
      return '';
    }
  }, [generateComment]);

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

  const handleAiToggle = useCallback((checked: boolean) => {
    setAICommentsToggleEnabled(checked);
  }, [setAICommentsToggleEnabled]);

  const parent = document.getElementById('MobileNavigationHead');

  if (!parent) {
    console.warn('No parent container for MobileStickyInput');
    return null;
  }

  if (menuVisible) {
    return null;
  }

  if (focused) {
    return (
      <div className="MobileStickyInputFocused">
        <div className="mobile-editor-container">
          <div className="header-row">
            <div className="left-section">
              <CWText type="h4">
                {mode === 'thread' ? 'Create Thread' : 'Write Comment'}
              </CWText>
            </div>
          </div>

          {mode === 'thread' ? (
            <NewThreadForm 
              onCancel={handleCancel}
              aiCommentsToggleEnabled={aiCommentsToggleEnabled}
              setAICommentsToggleEnabled={setAICommentsToggleEnabled}
              onAiGenerate={handleAiGenerate}
            />
          ) : (
            <CommentEditor
              {...props}
              shouldFocus={true}
              onCancel={handleCancel}
              aiCommentsToggleEnabled={aiCommentsToggleEnabled}
              setAICommentsToggleEnabled={setAICommentsToggleEnabled}
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
        setAICommentsToggleEnabled={setAICommentsToggleEnabled}
      />
    </div>,
    parent,
  );
};