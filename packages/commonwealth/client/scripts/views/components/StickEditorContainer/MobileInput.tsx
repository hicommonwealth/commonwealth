import { useFlag } from 'hooks/useFlag';
import { useGenerateCommentText } from 'hooks/useGenerateCommentText';
import React, { useCallback, useMemo, useState } from 'react';
import useUserStore from 'state/ui/user';
import { Avatar } from 'views/components/Avatar';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { useActiveStickCommentReset } from 'views/components/StickEditorContainer/context/UseActiveStickCommentReset';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileInput.scss';

export type MobileInputProps = CommentEditorProps & {
  onFocus?: () => void;
  replyingToAuthor?: string;
  useAiStreaming: boolean;
  setUseAiStreaming: (value: boolean) => void;
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
    useAiStreaming,
    setUseAiStreaming,
  } = props;
  const [value, setValue] = useState('');
  const user = useUserStore();
  const { generateComment } = useGenerateCommentText();
  const stickyCommentReset = useActiveStickCommentReset();
  const aiCommentsEnabled = useFlag('aiComments');

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
    setUseAiStreaming(!useAiStreaming);
  }, [useAiStreaming, setUseAiStreaming]);

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (value.trim() !== '' && event.key === 'Enter') {
      const submittedText = value.trim();

      try {
        let aiPromise;
        if (useAiStreaming && onAiReply) {
          aiPromise = generateComment(submittedText);
        }

        setValue('');

        const commentId = await handleSubmitComment();
        stickyCommentReset();

        if (aiPromise) {
          try {
            const aiReply = await aiPromise;
            if (aiReply && onAiReply) {
              onAiReply(aiReply);
            }
          } catch (error) {
            console.error('AI generation failed:', error);
          }
        }

        if (typeof commentId === 'number') {
          // Delay to allow the new comment to render in the DOM before scrolling/highlighting
          setTimeout(() => {
            jumpHighlightComment(commentId);
          }, 100);
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
    if (filtered.length > 0) {
      return filtered[0].profile?.avatarUrl;
    }
    return undefined;
  }, [user]);

  const placeholder = isReplying
    ? `Replying to ${replyingToAuthor} ...`
    : `Comment on thread...`;

  return (
    <div className="MobileInput">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          width: '100%',
        }}
      >
        {avatarURL && (
          <div className="AvatarBox">
            <Avatar url={avatarURL} size={32} />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #E5E5E5',
          }}
        >
          <input
            type="text"
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            value={value}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              textOverflow: 'ellipsis',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {aiCommentsEnabled && (
              <div className="ai-toggle">
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CWToggle
                    checked={useAiStreaming}
                    onChange={handleAiToggle}
                    icon="sparkle"
                    size="xs"
                    iconColor="#757575"
                  />
                  <span style={{ fontSize: '12px', color: '#757575' }}>AI</span>
                </div>
              </div>
            )}
            <div className="RightButton">
              {isReplying && (
                <CWIconButton iconName="close" onClick={handleClose} />
              )}
              <CWIconButton iconName="arrowsOutSimple" onClick={onFocus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileInput;
