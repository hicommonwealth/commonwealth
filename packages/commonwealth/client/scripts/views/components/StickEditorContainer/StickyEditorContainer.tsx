import useBrowserWindow from 'hooks/useBrowserWindow';
import React from 'react';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';
import './StickyEditorContainer.scss';

export const StickyEditorContainer = ({
  parentType,
  canComment,
  handleSubmitComment,
  errorMsg,
  contentDelta,
  setContentDelta,
  disabled,
  onCancel,
  author,
  editorValue,
  tooltipText,
  isReplying,
  replyingToAuthor,
  onCommentCreated,
  aiCommentsToggleEnabled,
}: CommentEditorProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  return isWindowExtraSmall ? (
    <MobileStickyInput
      parentType={parentType}
      canComment={canComment}
      handleSubmitComment={handleSubmitComment}
      errorMsg={errorMsg}
      contentDelta={contentDelta}
      setContentDelta={setContentDelta}
      disabled={disabled}
      onCancel={onCancel}
      author={author}
      editorValue={editorValue}
      tooltipText={tooltipText}
      isReplying={isReplying}
      replyingToAuthor={replyingToAuthor}
      onCommentCreated={onCommentCreated}
      aiCommentsToggleEnabled={aiCommentsToggleEnabled}
    />
  ) : (
    <DesktopStickyInput
      parentType={parentType}
      canComment={canComment}
      handleSubmitComment={handleSubmitComment}
      errorMsg={errorMsg}
      contentDelta={contentDelta}
      setContentDelta={setContentDelta}
      disabled={disabled}
      onCancel={onCancel}
      author={author}
      editorValue={editorValue}
      tooltipText={tooltipText}
      isReplying={isReplying}
      replyingToAuthor={replyingToAuthor}
      onCommentCreated={onCommentCreated}
      aiCommentsToggleEnabled={aiCommentsToggleEnabled}
    />
  );
};
