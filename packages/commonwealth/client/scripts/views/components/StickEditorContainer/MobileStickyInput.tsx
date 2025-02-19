import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import app from 'state';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useSidebarStore from 'state/ui/sidebar/sidebar';
import useUserStore, { useLocalAISettingsStore } from 'state/ui/user';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import CommentEditor from 'views/components/Comments/CommentEditor/CommentEditor';
import { NewThreadForm } from 'views/components/NewThreadFormLegacy/NewThreadForm';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import { MobileInput } from './MobileInput';
import './MobileStickyInput.scss';
import { StickCommentContext } from './context/StickCommentProvider';

export const MobileStickyInput = (props: CommentEditorProps) => {
  const { handleSubmitComment } = props;
  const [focused, setFocused] = useState(false);
  const { mode } = useContext(StickCommentContext);
  const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
    useLocalAISettingsStore();
  const [streamingReplyIds, setStreamingReplyIds] = useState<number[]>([]);
  const menuVisible = useSidebarStore((state) => state.menuVisible);
  const { generateComment } = useGenerateCommentText();
  const navigate = useCommonNavigate();
  const communityId = app.activeChainId() || '';
  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });
  const user = useUserStore();

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
      console.log('MobileStickyInput: handleThreadCreation started');
      console.log('MobileStickyInput: Current communityId:', communityId);
      console.log(
        'MobileStickyInput: Current location:',
        window.location.pathname,
      );

      if (!app.chain?.base) {
        console.log('MobileStickyInput: No chain base found');
        notifyError('Invalid community configuration');
        throw new Error('Invalid community configuration');
      }

      try {
        console.log('MobileStickyInput: Fetching topics...');
        // Find a default topic (prefer "General" if it exists)
        const { data: topics = [] } = await useFetchTopicsQuery({
          communityId,
          apiEnabled: !!communityId,
        });
        console.log(
          'MobileStickyInput: Topics fetched:',
          topics.map((t) => ({ id: t.id, name: t.name })),
        );

        const defaultTopic =
          topics.find((t) => t.name.toLowerCase() === 'general') || topics[0];

        if (!defaultTopic) {
          console.log('MobileStickyInput: No default topic found');
          notifyError('No topic available for thread creation');
          throw new Error('No topic available');
        }
        console.log('MobileStickyInput: Selected default topic:', {
          id: defaultTopic.id,
          name: defaultTopic.name,
        });

        console.log(
          'MobileStickyInput: Building thread input with topic:',
          defaultTopic,
        );
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

        console.log(
          'MobileStickyInput: Creating thread with input:',
          threadInput,
        );
        const thread = await createThread(threadInput);

        if (!thread?.id) {
          console.log('MobileStickyInput: No thread ID returned');
          throw new Error('Failed to create thread - no ID returned');
        }
        console.log('MobileStickyInput: Thread created successfully:', {
          id: thread.id,
          title: thread.title,
          community_id: thread.community_id,
        });

        // Close the form before navigation
        console.log('MobileStickyInput: Closing form');
        setFocused(false);

        // Clear any content
        console.log('MobileStickyInput: Clearing content');
        props.setContentDelta(createDeltaFromText(''));

        // Construct the correct navigation path
        const communityPrefix = communityId ? `/${communityId}` : '';
        const threadUrl = `${communityPrefix}/discussion/${thread.id}-${thread.title}`;
        console.log('MobileStickyInput: Navigation details:', {
          communityPrefix,
          threadId: thread.id,
          threadTitle: thread.title,
          fullUrl: threadUrl,
          currentPath: window.location.pathname,
        });

        console.log('MobileStickyInput: Setting up navigation timeout');
        setTimeout(() => {
          console.log('MobileStickyInput: Pre-navigation state:', {
            focused: focused,
            currentPath: window.location.pathname,
            targetUrl: threadUrl,
          });
          navigate(threadUrl);
          console.log('MobileStickyInput: Navigation function called');
        }, 0);

        console.log('MobileStickyInput: Returning thread ID');
        return thread.id;
      } catch (error) {
        console.error('MobileStickyInput: Error creating thread:', error);
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
      focused,
    ],
  );

  const customHandleSubmitComment = useCallback(async (): Promise<number> => {
    setFocused(false);

    if (mode === 'thread') {
      return handleThreadCreation(getTextFromDelta(props.contentDelta));
    }

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
