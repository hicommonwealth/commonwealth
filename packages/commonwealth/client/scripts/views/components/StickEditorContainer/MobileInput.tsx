import { notifyError } from 'controllers/app/notifications';
import { ThreadKind, ThreadStage } from 'models/types';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import Turnstile, { useTurnstile } from 'react-turnstile';
import app from 'state';
import { useAiCompletion } from 'state/api/ai';
import { generateCommentPrompt } from 'state/api/ai/prompts';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import { Avatar } from 'views/components/Avatar';
import type { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { StickCommentContext } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { useActiveStickCommentReset } from 'views/components/StickEditorContainer/context/UseActiveStickCommentReset';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileInput.scss';

export type MobileInputProps = CommentEditorProps & {
  onFocus?: () => void;
  replyingToAuthor?: string;
  aiCommentsToggleEnabled: boolean;
  parentCommentText?: string;
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
    parentCommentText,
    thread: originalThread,
  } = props;

  const { mode } = useContext(StickCommentContext);
  const [value, setValue] = useState('');
  const user = useUserStore();
  const { generateCompletion } = useAiCompletion();
  const stickyCommentReset = useActiveStickCommentReset();

  const communityId = app.activeChainId() || '';
  const { mutateAsync: createThreadMutation } = useCreateThreadMutation({
    communityId,
  });
  const navigate = useCommonNavigate();

  const { data: fetchedTopics = [] } = useFetchTopicsQuery({
    communityId,
    includeContestData: true,
    apiEnabled: !!communityId,
  });
  const sortedTopics = [...fetchedTopics].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // Define default constants (must match NewThreadForm and ViewThreadPage)
  const DEFAULT_THREAD_TITLE = 'Untitled Discussion';
  const DEFAULT_THREAD_BODY = 'No content provided.';

  // Add turnstile related code
  const turnstileSiteKey = process.env.CF_TURNSTILE_CREATE_THREAD_SITE_KEY;
  const isTurnstileEnabled = !!turnstileSiteKey && (user.tier || 0) < 3;
  const turnstile = useTurnstile();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // When AI mode is enabled or there is some text, allow submission on Enter.
    if (
      (aiCommentsToggleEnabled || value.trim() !== '') &&
      event.key === 'Enter'
    ) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let submittedText = value.trim();

    // For non-thread submissions, apply default text if nothing is provided.
    if (mode !== 'thread' && aiCommentsToggleEnabled && submittedText === '') {
      submittedText = 'New Comment';
    }

    if (mode === 'thread') {
      try {
        // Check for turnstile verification if enabled
        if (isTurnstileEnabled && !turnstileToken) {
          notifyError('Please complete the Turnstile verification');
          return;
        }

        // Find a default topic (prefer "General" if it exists)
        const defaultTopic =
          sortedTopics.find(
            (topic) => topic.name.toLowerCase() === 'general',
          ) || sortedTopics[0];

        if (!defaultTopic) {
          notifyError('No topic available for thread creation');
          throw new Error('No topic available');
        }

        if (!app.chain?.base) {
          notifyError('Invalid community configuration');
          throw new Error('Invalid community configuration');
        }

        // For mobile thread creation in AI mode, we want to fill in default values
        const effectiveTitle = aiCommentsToggleEnabled
          ? DEFAULT_THREAD_TITLE
          : submittedText.split('\n')[0] || DEFAULT_THREAD_TITLE;

        const effectiveBody = aiCommentsToggleEnabled
          ? submittedText || DEFAULT_THREAD_BODY
          : submittedText;

        const threadInput = await buildCreateThreadInput({
          address: user.activeAccount?.address || '',
          kind: ThreadKind.Discussion,
          stage: ThreadStage.Discussion,
          communityId,
          communityBase: app.chain.base,
          title: effectiveTitle,
          topic: defaultTopic,
          body: effectiveBody,
          turnstileToken,
        });

        const thread = await createThreadMutation(threadInput);

        // Clear the input and reset turnstile
        setValue('');
        if (turnstile) {
          turnstile.reset();
          setTurnstileToken(null);
        }

        // Construct the correct navigation path with proper URL encoding
        const encodedTitle = encodeURIComponent(
          thread.title.replace(/\s+/g, '-'),
        );
        const threadUrl = `/discussion/${thread.id}-${encodedTitle}`;

        // Use the common navigate function which handles prefixes and custom domains
        // Use replace: true to prevent the redirect loop
        navigate(threadUrl, { replace: true });
      } catch (error) {
        console.error('Error creating thread:', error);
        notifyError('Failed to create thread');

        // Reset turnstile on error
        if (turnstile) {
          turnstile.reset();
          setTurnstileToken(null);
        }
      }
    } else {
      // --- Traditional Comment Submission Logic ---
      try {
        let aiPromise;
        if (aiCommentsToggleEnabled && onAiReply) {
          const context = `
          Thread: ${originalThread?.title || ''}
          ${parentCommentText ? `Parent Comment: ${parentCommentText}` : ''}
          `;

          const prompt = generateCommentPrompt(context);

          aiPromise = generateCompletion(prompt, {
            stream: false,
          });
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
    const filtered = user.accounts.filter(
      (current) => current.profile?.avatarUrl,
    );
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
            <div className="RightButton">
              {isReplying && (
                <CWIconButton iconName="close" onClick={handleClose} />
              )}
              <CWIconButton iconName="arrowsOutSimple" onClick={onFocus} />
            </div>
          </div>
        </div>
      </div>

      {mode === 'thread' && isTurnstileEnabled && (
        <div className="mobile-turnstile-container">
          <Turnstile
            sitekey={turnstileSiteKey || ''}
            onVerify={(token) => {
              console.log('Mobile Turnstile verified', token);
              setTurnstileToken(token);
            }}
            onExpire={() => {
              console.log('Mobile Turnstile expired');
              setTurnstileToken(null);
              turnstile.reset();
            }}
            onError={() => {
              console.log('Mobile Turnstile error');
              setTurnstileToken(null);
              notifyError('Turnstile verification failed. Please try again.');
            }}
            appearance="interaction-only"
            theme="light"
            fixedSize={false}
            size="compact"
          />
        </div>
      )}
    </div>
  );
};

export default MobileInput;
