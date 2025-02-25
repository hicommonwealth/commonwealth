import { notifyError } from 'controllers/app/notifications';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import { useLocalAISettingsStore } from 'state/ui/user/localAISettings';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import type {
  CommentEditorProps,
  StreamingReplyData,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import { ChipsAndModelBar } from './ChipsAndModelBar';
import './DesktopStickyInput.scss';
import { useStickComment } from './context/StickCommentProvider';

export const DesktopStickyInput = (props: CommentEditorProps) => {
  const { isReplying, replyingToAuthor, onCancel, handleSubmitComment } = props;
  const { mode, isExpanded, setIsExpanded } = useStickComment();
  const aiCommentsFeatureEnabled = useFlag('aiComments');
  const {
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    selectedModels,
    setSelectedModels,
  } = useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<
    StreamingReplyData[]
  >([]);
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
    (commentId: number, modelIds?: string[]) => {
      // If modelIds parameter is provided, use it
      // Otherwise, use the persisted selectedModels state
      const modelsToUse =
        modelIds ||
        (selectedModels.length > 0
          ? selectedModels.map((model) => model.value)
          : ['anthropic/claude-3.5-sonnet']);

      console.log(
        'DesktopStickyInput - handleAiReply with models:',
        modelsToUse,
      );
      console.log(
        'DesktopStickyInput - Selected models state:',
        selectedModels.map((m) => `${m.label} (${m.value})`),
      );

      if (modelsToUse.length === 0) {
        // If no models are selected, continue with default behavior
        console.log(
          'DesktopStickyInput - No models selected, using default model',
        );
        const defaultModel = 'anthropic/claude-3.5-sonnet';

        // Check if we're already streaming this model for this comment
        if (
          streamingReplyIds.some(
            (reply) =>
              reply.commentId === commentId && reply.modelId === defaultModel,
          )
        ) {
          console.log(
            `DesktopStickyInput - Already streaming default model for comment ${commentId}`,
          );
          return;
        }

        setStreamingReplyIds((prev) => [
          ...prev,
          { commentId, modelId: defaultModel },
        ]);
        console.log(
          `DesktopStickyInput - Calling onAiReply with comment ${commentId} and default model`,
        );
        props.onAiReply?.(commentId, [defaultModel]);
      } else {
        // For each selected model, create a streaming reply
        const newStreamingReplies = modelsToUse.map((modelId) => ({
          commentId,
          modelId,
        }));

        // Filter out any models that are already streaming for this comment
        const filteredNewReplies = newStreamingReplies.filter(
          (newReply) =>
            !streamingReplyIds.some(
              (existing) =>
                existing.commentId === newReply.commentId &&
                existing.modelId === newReply.modelId,
            ),
        );

        if (filteredNewReplies.length > 0) {
          console.log(
            'DesktopStickyInput - Adding streaming replies for models:',
            filteredNewReplies.map((reply) => reply.modelId),
          );
          setStreamingReplyIds((prev) => [...prev, ...filteredNewReplies]);
          // Pass the selected model IDs to onAiReply
          console.log(
            `DesktopStickyInput - Calling onAiReply with comment ${commentId} and models:`,
            modelsToUse,
          );
          props.onAiReply?.(commentId, modelsToUse);
        } else {
          console.log(
            'DesktopStickyInput - All selected models are already streaming',
          );
        }
      }
    },
    [props.onAiReply, streamingReplyIds, selectedModels],
  );

  const handleAiGenerate = useCallback(
    async (text: string) => {
      try {
        const responses = await generateComment(
          text,
          (update, modelId) => {
            console.log(`AI generation update for ${modelId}:`, update);
          },
          selectedModels.map((m) => m.value),
        );
        // Combine all responses into a single string
        return Object.values(responses).join('\n\n---\n\n');
      } catch (error) {
        console.error('Failed to generate AI text:', error);
        return '';
      }
    },
    [generateComment, selectedModels],
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
          {aiCommentsToggleEnabled && (
            <ChipsAndModelBar
              onChipAction={(action) => {
                if (action === 'summary') {
                  handleAiGenerate('Please summarize the discussion');
                } else if (action === 'question') {
                  handleAiGenerate('Please generate a relevant question');
                }
              }}
              selectedModels={selectedModels}
            />
          )}
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
          {aiCommentsToggleEnabled && (
            <ChipsAndModelBar
              onChipAction={(action) => {
                if (action === 'summary') {
                  handleAiGenerate('Please summarize the discussion');
                } else if (action === 'question') {
                  handleAiGenerate('Please generate a relevant question');
                }
              }}
              selectedModels={selectedModels}
            />
          )}
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
