import { useFlag } from 'hooks/useFlag';
import React, { useCallback, useMemo, useState, useContext } from 'react';
import { useGenerateCommentText } from 'state/api/comments/generateCommentText';
import useUserStore from 'state/ui/user';
import { Avatar } from 'views/components/Avatar';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { useActiveStickCommentReset } from 'views/components/StickEditorContainer/context/UseActiveStickCommentReset';
import { StickCommentContext } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileInput.scss';

// --- Thread creation imports ---
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useCreateThreadMutation } from 'state/api/threads';
import { ThreadKind, ThreadStage } from 'models/types';
import { getEthChainIdOrBech32Prefix } from 'controllers/server/sessions';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';

// NEW: Import topics query to allow searching for a default topic
import { useFetchTopicsQuery } from 'state/api/topics';

export type MobileInputProps = CommentEditorProps & {
  onFocus?: () => void;
  replyingToAuthor?: string;
  aiCommentsToggleEnabled: boolean;
  setAICommentsToggleEnabled: (value: boolean) => void;
};

export const MobileInput = (props: MobileInputProps) => {
  const {
    onFocus,
    setContentDelta,
    handleSubmitComment,
    isReplying,
    replyingToAuthor,
    onCancel,
    onAiReply,
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
  } = props;

  const { mode } = useContext(StickCommentContext);
  const [value, setValue] = useState('');
  const user = useUserStore();
  const { generateComment } = useGenerateCommentText();
  const stickyCommentReset = useActiveStickCommentReset();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  // --- Thread creation hooks ---
  const communityId = app.activeChainId() || '';
  const { mutateAsync: createThreadMutation } = useCreateThreadMutation({ communityId });
  const navigate = useCommonNavigate();

  // NEW: Fetch topics for default selection (similar to NewThreadForm)
  const { data: fetchedTopics = [] } = useFetchTopicsQuery({
    communityId,
    includeContestData: true,
    apiEnabled: !!communityId,
  });
  const sortedTopics = [...fetchedTopics].sort((a, b) => a.name.localeCompare(b.name));

  const handleClose = useCallback(
    (e: React.MouseEvent<HTMLElement | SVGSVGElement>) => {
      stickyCommentReset();
      onCancel(e);
    },
    [stickyCommentReset, onCancel],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      setContentDelta(createDeltaFromText(event.target.value));
    },
    [setContentDelta],
  );

  const handleAiToggle = useCallback(() => {
    setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
  }, [aiCommentsToggleEnabled, setAICommentsToggleEnabled]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((aiCommentsToggleEnabled || value.trim() !== '') && event.key === 'Enter') {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let submittedText = value.trim();

    // If AI mode is enabled and no text was provided, supply default text based on mode.
    if (aiCommentsToggleEnabled && submittedText === '') {
      submittedText = mode === 'thread' ? 'New Thread Body' : 'New Comment';
    }

    if (mode === 'thread') {
      // --- Quick Thread Creation Logic ---
      const lines = submittedText.split('\n');
      const title = lines[0] || 'New Thread Title';
      const body = submittedText;
      try {
        // Instead of a hard-coded object, search for a topic named "General" in the sorted topics.
        const defaultTopic =
          sortedTopics.find(topic => topic.name.toLowerCase() === 'general') ||
          (sortedTopics.length > 0 ? sortedTopics[0] : { id: 1, name: 'General' });
        const threadInput = await buildCreateThreadInput({
          address: user.activeAccount?.address || '',
          kind: ThreadKind.Discussion,
          stage: ThreadStage.Discussion,
          communityId,
          communityBase: app.chain?.base || '',
          title,
          topic: defaultTopic,
          body,
          url: '', // For quick thread creation, URL is empty.
          ethChainIdOrBech32Prefix: getEthChainIdOrBech32Prefix({
            base: app.chain?.base || '',
            bech32_prefix: app.chain?.bech32_prefix || '',
            eth_chain_id: app.chain?.ChainNode?.eth_chain_id || 0,
          }),
        });
        const thread = await createThreadMutation(threadInput);
        navigate(`/discussion/${thread.id}-${thread.title}`);
        setValue('');
      } catch (error) {
        notifyError('Failed to create thread');
        console.error('Thread creation error:', error);
      }
    } else {
      // --- Traditional Comment Submission Logic ---
      try {
        let aiPromise;
        if (aiCommentsToggleEnabled && onAiReply) {
          aiPromise = generateComment(submittedText);
        }
        // Call the actual comment submission logic passed in as a prop.
        const commentId = await handleSubmitComment();
        setValue('');
        stickyCommentReset();

        if (aiPromise && onAiReply) {
          try {
            const aiReply = await aiPromise;
            if (aiReply) {
              onAiReply(aiReply);
            }
          } catch (error) {
            console.error('AI generation failed:', error);
          }
        }
        if (typeof commentId === 'number') {
          try {
            await listenForComment(commentId, aiCommentsToggleEnabled);
          } catch (error) {
            console.warn('MobileInput - Failed to jump to comment:', error);
          }
        }
      } catch (error) {
        console.error('Error during comment submission:', error);
      }
    }
  };

  const avatarURL = useMemo(() => {
    const filtered = user.accounts.filter((current) => current.profile?.avatarUrl);
    return filtered.length > 0 ? filtered[0].profile?.avatarUrl : undefined;
  }, [user]);

  const placeholder =
    mode === 'thread'
      ? 'Create a thread...'
      : isReplying
      ? `Replying to ${replyingToAuthor} ...`
      : 'Comment on thread...';

  return (
    <div className="MobileInput">
      <div className="container">
        {avatarURL && (
          <div className="AvatarBox">
            <Avatar url={avatarURL} size={32} />
          </div>
        )}
        <div className="input-container">
          <input
            type="text"
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            value={value}
            className="input"
          />
          <div className="ai-toggle-row">
            {aiCommentsFeatureEnabled && (
              <div className="ai-toggle">
                <div className="ai-toggle-container">
                  <CWToggle
                    checked={aiCommentsToggleEnabled}
                    onChange={handleAiToggle}
                    icon="sparkle"
                    size="xs"
                    iconColor="#757575"
                  />
                  <span className="label">AI</span>
                </div>
              </div>
            )}
            <div className="RightButton">
              {isReplying && <CWIconButton iconName="close" onClick={handleClose} />}
              <CWIconButton iconName="arrowsOutSimple" onClick={onFocus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileInput;