import { notifyError } from 'controllers/app/notifications';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore, { useLocalAISettingsStore } from 'state/ui/user';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './DesktopStickyInput.scss';
import { useStickComment } from './context/StickCommentProvider';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel, handleSubmitComment } = props;
  const { mode, isExpanded, setIsExpanded } = useStickComment();
  const aiCommentsFeatureEnabled = useFlag('aiComments');
  const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
    useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const { generateComment } = useGenerateCommentText();
  const navigate = useCommonNavigate();
  const communityId = app.activeChainId() || '';
  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });
  const user = useUserStore();

  const handleFocused = useCallback(() => {
    setIsExpanded(true);
  }, [setIsExpanded]);

  const handleCancel = useCallback(
    (event: React.MouseEvent) => {
      console.log('DesktopStickyInput: handleCancel triggered');
      setIsExpanded(false);
      onCancel?.(event);
    },
    [onCancel, setIsExpanded],
  );

  const handleAiToggle = useCallback(() => {
    setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
  }, [aiCommentsToggleEnabled, setAICommentsToggleEnabled]);

  const handleAiReply = useCallback(
    (commentId: number) => {
      if (streamingReplyIds.includes(commentId)) {
        return;
      }
      setStreamingReplyIds((prev) => [...prev, commentId]);
    },
    [streamingReplyIds],
  );

  const handleAiGenerate = useCallback(
    async (text: string) => {
      try {
        const generatedText = await generateComment(text, (update) => {
          console.log('AI generation update:', update);
        });
        return generatedText;
      } catch (error) {
        console.error('Failed to generate AI text:', error);
        return '';
      }
    },
    [generateComment],
  );

  const handleThreadCreation = useCallback(
    async (input: string): Promise<number> => {
      if (!app.chain?.base) {
        notifyError('Invalid community configuration');
        throw new Error('Invalid community configuration');
      }

      try {
        // Find a default topic (prefer "General" if it exists)
        const { data: topics = [] } = await useFetchTopicsQuery({
          communityId,
          apiEnabled: !!communityId,
        });
        const defaultTopic =
          topics.find((t) => t.name.toLowerCase() === 'general') || topics[0];

        if (!defaultTopic) {
          notifyError('No topic available for thread creation');
          throw new Error('No topic available');
        }

        const threadInput = await buildCreateThreadInput({
          address: user.activeAccount?.address || '',
          kind: 'discussion',
          stage: 'Discussion',
          communityId,
          communityBase: app.chain.base,
          title: aiCommentsToggleEnabled
            ? 'New Thread'
            : input.split('\n')[0] || 'New Thread',
          topic: defaultTopic,
          body: input,
        });

        const thread = await createThread(threadInput);
        if (!thread?.id) {
          throw new Error('Failed to create thread - no ID returned');
        }

        // Close the form before navigation
        setIsExpanded(false);

        // Clear any content
        props.setContentDelta(createDeltaFromText(''));

        // Ensure navigation happens after thread is created and cleanup
        const threadUrl = `/${communityId}/discussion/${thread.id}-${thread.title}`;
        setTimeout(() => navigate(threadUrl), 0);

        return thread.id;
      } catch (error) {
        console.error('Failed to create thread:', error);
        notifyError('Failed to create thread');
        throw error;
      }
    },
    [
      communityId,
      aiCommentsToggleEnabled,
      navigate,
      createThread,
      user.activeAccount,
      setIsExpanded,
      props.setContentDelta,
    ],
  );

  const handleEnhancedSubmit = useCallback(async (): Promise<number> => {
    setIsExpanded(false);

    if (mode === 'thread') {
      return handleThreadCreation(getTextFromDelta(props.contentDelta));
    }

    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('DesktopStickyInput - Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
    }

    if (aiCommentsToggleEnabled) {
      handleAiReply(commentId);
    }

    const attemptJump = () => {
      const commentElement = document.querySelector(`.comment-${commentId}`);
      if (commentElement) {
        jumpHighlightComment(commentId);
        return true;
      }
      return false;
    };

    await new Promise((resolve) => setTimeout(resolve, 500));
    attemptJump();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    attemptJump();

    setTimeout(() => {
      if (!attemptJump()) {
        console.error(
          `DesktopStickyInput - Comment element for ID ${commentId} not found in DOM after all attempts`,
        );
      }
    }, 2000);

    return commentId;
  }, [
    handleSubmitComment,
    aiCommentsToggleEnabled,
    handleAiReply,
    setIsExpanded,
    mode,
    handleThreadCreation,
    props.contentDelta,
  ]);

  const useExpandedEditor = isExpanded || isReplying;

  const editorProps = {
    ...props,
    shouldFocus: true,
    onCancel: handleCancel,
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    handleSubmitComment: handleEnhancedSubmit,
    onAiReply: handleAiReply,
    streamingReplyIds,
  };

  return (
    <div className="DesktopStickyInput">
      {!useExpandedEditor ? (
        <div className="DesktopStickyInputCollapsed">
          <div className="container">
            <input
              type="text"
              className="form-control"
              placeholder={
                mode === 'thread'
                  ? 'Create a thread...'
                  : replyingToAuthor
                    ? `Reply to ${replyingToAuthor}...`
                    : 'Write a comment...'
              }
              onClick={handleFocused}
            />
            {aiCommentsFeatureEnabled && (
              <div className="ai-comments-toggle-container">
                <CWToggle
                  className="ai-toggle"
                  checked={aiCommentsToggleEnabled}
                  onChange={handleAiToggle}
                  icon="sparkle"
                  size="xs"
                  iconColor="#757575"
                />
                <span className="label">AI</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="DesktopStickyInputExpanded">
          {mode === 'thread' ? (
            <NewThreadForm
              onCancel={handleCancel}
              aiCommentsToggleEnabled={aiCommentsToggleEnabled}
              setAICommentsToggleEnabled={setAICommentsToggleEnabled}
              onAiGenerate={handleAiGenerate}
            />
          ) : (
            <CommentEditor {...editorProps} />
          )}
        </div>
      )}
    </div>
  );
};
