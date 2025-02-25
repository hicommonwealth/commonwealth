import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import app from 'state';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';
import {
  useCreateThreadMutation,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useSidebarStore from 'state/ui/sidebar/sidebar';
import useUserStore from 'state/ui/user';
import { useLocalAISettingsStore } from 'state/ui/user/localAISettings';
import type { StreamingReplyData } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import useFetchCommentsQuery from '../../../state/api/comments/fetchComments';
import { ChipsAndModelBar, ChipsContext } from './ChipsAndModelBar';
import { MobileInput } from './MobileInput';
import './MobileStickyInput.scss';
import { StickCommentContext } from './context/StickCommentProvider';
import { ExtendedCommentEditorProps } from './types';

export const MobileStickyInput = (props: ExtendedCommentEditorProps) => {
  const { handleSubmitComment, isReplying, replyingToAuthor, rootThread } =
    props;

  // Get thread ID from rootThread prop
  const threadId = rootThread?.id;
  const communityId = app.activeChainId() || '';

  // Fetch thread data using the thread ID if not already provided in rootThread
  const { data: threadData } = useGetThreadsByIdQuery({
    community_id: communityId,
    thread_ids: threadId ? [threadId] : [],
    apiCallEnabled: !!threadId && !!communityId && !rootThread?.body,
  });

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });

  // Use rootThread if available, otherwise use fetched thread data
  const fetchedThread = React.useMemo(() => {
    if (rootThread?.body) {
      return rootThread;
    }
    if (threadData && threadData.length > 0) {
      return threadData[0];
    }
    return null;
  }, [rootThread, threadData]);

  const [focused, setFocused] = useState(false);
  const { mode } = useContext(StickCommentContext);
  const {
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
    selectedModels,
  } = useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<
    StreamingReplyData[]
  >([]);
  const menuVisible = useSidebarStore((state) => state.menuVisible);
  const { generateComment } = useGenerateCommentText();
  const navigate = useCommonNavigate();
  const user = useUserStore();

  // Add useFetchCommentsQuery hook for parent comment
  const { data: parentCommentData } = useFetchCommentsQuery({
    thread_id: threadId ? Number(threadId) : 0,
    comment_id: props.parentCommentId,
    include_reactions: false,
    include_spam_comments: false,
    limit: 1,
    cursor: 1,
    order_by: 'newest',
    apiEnabled: !!threadId && !!props.parentCommentId,
  });

  // Create context object for ChipsAndModelBar
  const chipsContext: ChipsContext = {
    isReplyingToComment: !!isReplying,
    commentId: props.parentCommentId,
    threadId: rootThread?.id || threadId,
    authorName: replyingToAuthor,
    threadBody: rootThread?.body || fetchedThread?.body || '',
    threadTitle: rootThread?.title || fetchedThread?.title || '',
  };

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  const handleAiReply = useCallback(
    (commentId: number, modelIds?: string[]) => {
      // If modelIds parameter is provided, use it
      // Otherwise, use only the first selected model to prevent multi-streaming
      const modelsToUse =
        modelIds ||
        (selectedModels.length > 0
          ? [selectedModels[0].value] // Only use the first model
          : ['anthropic/claude-3.5-sonnet']);

      if (modelsToUse.length === 0) {
        // If no models are selected, continue with default behavior
        const defaultModel = 'anthropic/claude-3.5-sonnet';

        // Check if we're already streaming this model for this comment
        if (
          streamingReplyIds.some(
            (reply) =>
              reply.commentId === commentId && reply.modelId === defaultModel,
          )
        ) {
          return;
        }

        setStreamingReplyIds((prev) => [
          ...prev,
          { commentId, modelId: defaultModel },
        ]);
        props.onAiReply?.(commentId, [defaultModel]);
      } else {
        // Create a streaming reply for the first/only model in the array
        const modelId = modelsToUse[0];

        // Check if we're already streaming this model for this comment
        if (
          streamingReplyIds.some(
            (reply) =>
              reply.commentId === commentId && reply.modelId === modelId,
          )
        ) {
          return;
        }

        // Only add one streaming reply
        setStreamingReplyIds((prev) => [...prev, { commentId, modelId }]);

        // Pass only the selected model ID to onAiReply
        props.onAiReply?.(commentId, [modelId]);
      }
    },
    [props.onAiReply, streamingReplyIds, selectedModels],
  );

  const handleAiGenerate = useCallback(
    async (text: string) => {
      try {
        // Log only the final prompt context
        console.log('AI Generate Prompt:', {
          promptText: text,
          threadContext: {
            threadId: rootThread?.id || threadId,
            hasThreadTitle: !!(rootThread?.title || fetchedThread?.title),
            hasThreadBody: !!(rootThread?.body || fetchedThread?.body),
            isReplying: !!props.parentCommentId,
            modelToUse:
              selectedModels.length > 0
                ? selectedModels[0].value
                : 'anthropic/claude-3.5-sonnet',
          },
        });

        // Clear the editor first
        props.setContentDelta(createDeltaFromText(''));

        // Use a single model (the first selected one) to avoid multiple streams
        const modelToUse =
          selectedModels.length > 0
            ? selectedModels[0].value
            : 'anthropic/claude-3.5-sonnet';

        let accumulatedText = '';

        // Use the streaming callback to update the editor in real-time
        await generateComment(
          text,
          (update) => {
            accumulatedText += update;
            accumulatedText = accumulatedText.trim();
            props.setContentDelta(createDeltaFromText(accumulatedText));
          },
          [modelToUse], // Only use one model
        );

        return accumulatedText;
      } catch (error) {
        console.error('Failed to generate AI text:', error);
        return '';
      }
    },
    [
      generateComment,
      selectedModels,
      props.setContentDelta,
      rootThread,
      threadId,
      fetchedThread,
      props.parentCommentId,
    ],
  );

  const handleChipAction = useCallback(
    async (action: 'summary' | 'question' | 'draft' | 'generate-replies') => {
      if (!aiCommentsToggleEnabled) return;

      // Always focus the editor when any action is triggered
      setFocused(true);

      switch (action) {
        case 'summary': {
          const summary = await handleAiGenerate(
            'Please summarize the discussion',
          );
          if (summary) {
            props.setContentDelta(createDeltaFromText(summary));
          }
          break;
        }
        case 'draft': {
          // Build a context-aware prompt that includes thread and parent comment content
          let contextInfo = '';
          let replyingToAuthor = '';

          // Add parent comment text to context if available
          if (props.parentCommentId) {
            const parentComment = parentCommentData?.pages?.[0]?.results?.[0];
            if (parentComment) {
              // Get author name or use a default
              replyingToAuthor = 'the comment author';
              contextInfo += `Replying to a comment: "${parentComment.body}"\n\n`;
            }
          }

          // Add thread title and body to context
          if (fetchedThread) {
            if (fetchedThread.title) {
              contextInfo += `Thread title: "${fetchedThread.title}"\n\n`;
            }
            if (fetchedThread.body) {
              contextInfo += `Thread content: "${fetchedThread.body}"\n\n`;
            }
          }

          // Create the final prompt with context
          if (isReplying && replyingToAuthor) {
            const prompt = `${contextInfo}Please draft a thoughtful reply to ${replyingToAuthor} based on the context provided.`;
            const draft = await handleAiGenerate(prompt);
            if (draft) {
              props.setContentDelta(createDeltaFromText(draft));
            }
          } else {
            const prompt = `${contextInfo}Please draft a thoughtful response based on the context provided.`;
            const draft = await handleAiGenerate(prompt);
            if (draft) {
              props.setContentDelta(createDeltaFromText(draft));
            }
          }
          break;
        }
        case 'generate-replies': {
          // If we're replying to a comment, generate replies for that comment
          if (isReplying && props.parentCommentId) {
            handleAiReply(props.parentCommentId);
          }
          // Otherwise generate replies for the thread root
          else if (threadId) {
            handleAiReply(threadId);
          }
          break;
        }
        default:
          break;
      }
    },
    [
      aiCommentsToggleEnabled,
      handleAiGenerate,
      handleAiReply,
      isReplying,
      replyingToAuthor,
      props.parentCommentId,
      threadId,
      fetchedThread?.body,
      fetchedThread?.title,
      props.setContentDelta,
      setFocused,
      parentCommentData,
    ],
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
        setFocused(false);

        // Clear any content
        props.setContentDelta(createDeltaFromText(''));

        // Construct the correct navigation path
        const communityPrefix = communityId ? `/${communityId}` : '';
        const threadUrl = `${communityPrefix}/discussion/${thread.id}-${thread.title}`;

        setTimeout(() => {
          navigate(threadUrl);
        }, 0);

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
      setFocused,
      props.setContentDelta,
    ],
  );

  const customHandleSubmitComment = useCallback(async (): Promise<number> => {
    setFocused(false);

    if (mode === 'thread') {
      return handleThreadCreation(getTextFromDelta(props.contentDelta));
    }

    const commentId = await handleSubmitComment();

    if (typeof commentId !== 'number' || isNaN(commentId)) {
      console.error('Invalid comment ID:', commentId);
      throw new Error('Invalid comment ID');
    }

    if (aiCommentsToggleEnabled) {
      handleAiReply(commentId);
    }

    try {
      await listenForComment(commentId, aiCommentsToggleEnabled);
    } catch (error) {
      console.warn('Failed to jump to comment:', error);
    }

    return commentId;
  }, [
    handleSubmitComment,
    aiCommentsToggleEnabled,
    handleAiReply,
    mode,
    handleThreadCreation,
    props.contentDelta,
  ]);

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

          {aiCommentsToggleEnabled && (
            <ChipsAndModelBar
              onChipAction={handleChipAction}
              selectedModels={selectedModels}
              context={chipsContext}
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
      {aiCommentsToggleEnabled && (
        <ChipsAndModelBar
          onChipAction={handleChipAction}
          selectedModels={selectedModels}
          context={chipsContext}
        />
      )}
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
