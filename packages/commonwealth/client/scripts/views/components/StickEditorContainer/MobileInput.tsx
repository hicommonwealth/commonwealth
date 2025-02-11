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
import { listenForComment } from 'views/pages/discussions/CommentTree/helpers';
import './MobileInput.scss';

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
  const [value, setValue] = useState('');
  const user = useUserStore();
  const { generateComment } = useGenerateCommentText();
  const stickyCommentReset = useActiveStickCommentReset();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

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
    if (value.trim() !== '' && event.key === 'Enter') {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const submittedText = value.trim();

    try {
      let aiPromise;
      if (aiCommentsToggleEnabled === true && onAiReply) {
        console.log('MobileInput - AI streaming is enabled, generating reply');
        aiPromise = generateComment(submittedText);
      } else {
        console.log(
          'MobileInput - AI streaming is disabled, skipping AI reply',
        );
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
        try {
          await listenForComment(commentId, aiCommentsToggleEnabled === true);
          console.log(
            'MobileInput - Successfully jumped to comment:',
            commentId,
          );
        } catch (error) {
          console.warn('MobileInput - Failed to jump to comment:', error);
        }
      }
    } catch (error) {
      console.error('Error during comment submission:', error);
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
