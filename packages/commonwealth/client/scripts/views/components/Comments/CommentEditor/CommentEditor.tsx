import { ContentType } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import Account from 'models/Account';
import type { DeltaStatic } from 'quill';
import React, { useCallback, useEffect } from 'react';
import { User } from 'views/components/user/user';
import { jumpHighlightComment } from 'views/pages/discussions/CommentTree/helpers';
import { isCommandClick } from '../../../../helpers';
import { CWText } from '../../component_kit/cw_text';
import { CWValidationText } from '../../component_kit/cw_validation_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import { CWToggle } from '../../component_kit/new_designs/cw_toggle';
import { ReactQuillEditor } from '../../react_quill_editor';
import './CommentEditor.scss';

export type CommentEditorProps = {
  parentType: ContentType;
  canComment: boolean;
  handleSubmitComment: () => Promise<number>;
  errorMsg: string;
  contentDelta: DeltaStatic;
  setContentDelta: React.Dispatch<React.SetStateAction<DeltaStatic>>;
  disabled: boolean;
  onCancel: (e: React.MouseEvent) => void;
  author: Account;
  editorValue: string;
  shouldFocus?: boolean;
  tooltipText?: string;
  isReplying?: boolean;
  useAiStreaming?: boolean;
  setUseAiStreaming?: (value: boolean) => void;
  onAiReply?: (commentId: number) => void;
  onCommentCreated?: (commentId: number, hasAI: boolean) => void;
  replyingToAuthor?: string;
  streamingReplyIds?: number[];
};

const CommentEditor = ({
  parentType,
  canComment,
  handleSubmitComment,
  errorMsg,
  contentDelta,
  setContentDelta,
  disabled,
  onCancel,
  author,
  shouldFocus,
  tooltipText,
  useAiStreaming: initialAiStreaming,
  setUseAiStreaming: onAiStreamingChange,
  onAiReply,
  onCommentCreated,
  replyingToAuthor,
  streamingReplyIds,
}: CommentEditorProps) => {
  const aiCommentsEnabled = useFlag('aiComments');

  // Debug log when component mounts or AI props change
  useEffect(() => {}, [initialAiStreaming, onAiReply]);

  const handleAiToggle = useCallback(() => {
    if (onAiStreamingChange) {
      onAiStreamingChange(!initialAiStreaming);
    }
  }, [initialAiStreaming, onAiStreamingChange]);

  const handleEnhancedSubmit = async () => {
    // Immediately close the editor before any operations
    onCancel?.(
      new MouseEvent('click', {
        bubbles: true,
      }) as unknown as React.MouseEvent,
    );

    // Handle the rest of the submission process asynchronously
    try {
      let commentId: number;
      try {
        commentId = await handleSubmitComment();
      } catch (error) {
        console.error('Failed to submit comment:', error);
        return;
      }

      // Ensure we have a valid comment ID before proceeding
      if (typeof commentId !== 'number' || isNaN(commentId)) {
        console.error('Invalid comment ID:', commentId);
        return;
      }

      if (onCommentCreated) {
        onCommentCreated(commentId, !!initialAiStreaming);
      }

      // Handle AI streaming and comment jumping asynchronously
      setTimeout(() => {
        // If AI streaming is enabled, trigger the AI reply through TreeHierarchy
        if (initialAiStreaming && onAiReply) {
          Promise.resolve(onAiReply(commentId)).catch((error) => {
            console.error('Failed to trigger AI reply:', error);
          });
        }

        // Function to attempt jumping to the comment
        const attemptJump = () => {
          const commentElement = document.querySelector(
            `.comment-${commentId}`,
          );
          if (commentElement) {
            jumpHighlightComment(commentId);
            return true;
          }
          return false;
        };

        // Try to jump to the comment
        if (!attemptJump()) {
          const container = document.querySelector('.CommentsTree');
          if (container) {
            const observer = new MutationObserver((mutations, obs) => {
              if (attemptJump()) {
                obs.disconnect();
              }
            });
            observer.observe(container, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 5000);
          }
        }
      }, 0);
    } catch (error) {
      console.error('Error during submission:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // If Enter is pressed and any modifier key is present (using isCommandClick), trigger submission
    if (
      event.key === 'Enter' &&
      isCommandClick(event as unknown as React.MouseEvent<HTMLDivElement>)
    ) {
      event.preventDefault();
      handleEnhancedSubmit();
    }
  };

  return (
    <div className="CommentEditor">
      <div className="attribution-row">
        <div className="attribution-left-content">
          <CWText type="caption">
            {parentType === ContentType.Comment ? 'Reply as' : 'Comment as'}
          </CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className={clsx('user-link-text', { disabled: !canComment })}
          >
            <User
              userAddress={author?.address}
              userCommunityId={author?.community?.id}
              shouldShowAsDeleted={!author?.address && !author?.community?.id}
              shouldHideAvatar
              shouldLinkProfile
            />
          </CWText>
        </div>
        <div className="attribution-right-content">
          {aiCommentsEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CWToggle
                className="ai-toggle"
                checked={!!initialAiStreaming}
                onChange={handleAiToggle}
                icon="sparkle"
                size="xs"
                iconColor="#757575"
              />
              <span style={{ fontSize: '12px', color: '#757575' }}>AI</span>
            </div>
          )}
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
      <ReactQuillEditor
        className="editor"
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        isDisabled={!canComment}
        tooltipLabel={tooltipText}
        shouldFocus={shouldFocus}
        onKeyDown={handleKeyDown}
      />
      <div className="form-bottom">
        <div className="form-buttons">
          <CWButton buttonType="tertiary" onClick={onCancel} label="Cancel" />
          <CWButton
            buttonWidth="wide"
            disabled={disabled}
            onClick={handleEnhancedSubmit}
            label="Post"
          />
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
