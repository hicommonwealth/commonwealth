import { ContentType } from '@hicommonwealth/shared';
import { buildCreateCommentInput } from 'client/scripts/state/api/comments/createComment';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { useDraft } from 'hooks/useDraft';
import { useMentionExtractor } from 'hooks/useMentionExtractor';
import Account from 'models/Account';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useCreateCommentMutation } from 'state/api/comments';
import useUserStore from 'state/ui/user';
import Thread from '../../../models/Thread';
import { useFetchProfilesByAddressesQuery } from '../../../state/api/profiles/index';
import { createDeltaFromText, getTextFromDelta } from '../react_quill_editor';
import { MentionEntityType } from '../react_quill_editor/mention-config';
import { serializeDelta } from '../react_quill_editor/utils';
import { StickyInput } from '../StickEditorContainer';
import { ArchiveMsg } from './ArchiveMsg';

type CreateCommentProps = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  parentCommentMsgId?: string | null;
  rootThread: Thread;
  canComment: boolean;
  tooltipText?: string;
  isReplying?: boolean;
  replyingToAuthor?: string;
  onCancel?: (event: React.MouseEvent) => void;
  onCommentCreated?: (commentId: number, hasAI: boolean) => void;
  aiCommentsToggleEnabled?: boolean;
  parentCommentText?: string;
};

export const CreateComment = ({
  handleIsReplying,
  parentCommentId,
  parentCommentMsgId,
  rootThread,
  canComment,
  tooltipText = '',
  isReplying,
  replyingToAuthor,
  onCancel,
  onCommentCreated,
  aiCommentsToggleEnabled = false,
  parentCommentText,
}: CreateCommentProps) => {
  const { saveDraft, restoreDraft, clearDraft } = useDraft<DeltaStatic>(
    !parentCommentId
      ? `new-thread-comment-${rootThread.id}`
      : `new-comment-reply-${parentCommentId}`,
  );

  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();
  const { extractMentionsFromDelta } = useMentionExtractor();

  // get restored draft on init
  const restoredDraft = useMemo(() => {
    return restoreDraft() || createDeltaFromText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [contentDelta, setContentDelta] = useState<DeltaStatic>(restoredDraft);

  const [sendingComment, setSendingComment] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editorValue = getTextFromDelta(contentDelta);

  const parentType = parentCommentId ? ContentType.Comment : ContentType.Thread;

  const { data } = useFetchProfilesByAddressesQuery({
    profileChainIds: user.activeAccount?.community?.id
      ? [user.activeAccount?.community?.id]
      : [],
    profileAddresses: user.activeAccount?.address
      ? [user.activeAccount?.address]
      : [],
    currentChainId: app.activeChainId() || '',
    apiCallEnabled: !!user.activeAccount?.profile,
  });
  if (user.activeAccount) {
    user.activeAccount.profile = data?.[0];
  }
  const author = user.activeAccount;

  const { mutateAsync: createComment } = useCreateCommentMutation({
    threadId: rootThread.id,
    communityId: app.activeChainId() || '',
    existingNumberOfComments: rootThread.numberOfComments || 0,
  });

  const handleSubmitComment = async (turnstileToken?: string | null) => {
    if (!user.activeAccount) {
      throw new Error('No active account');
    }

    setErrorMsg(null);
    setSendingComment(true);

    try {
      const communityId = app.activeChainId() || '';
      const input = await buildCreateCommentInput({
        communityId,
        address: user.activeAccount!.address,
        threadId: rootThread.id,
        threadMsgId: rootThread.canvasMsgId ?? null,
        unescapedText: serializeDelta(contentDelta),
        parentCommentId: parentCommentId ?? null,
        parentCommentMsgId: parentCommentMsgId ?? null,
        existingNumberOfComments: rootThread.numberOfComments || 0,
        turnstileToken,
      });

      const newComment = await createComment(input);

      if (!newComment?.id) {
        throw new Error('No comment ID returned');
      }

      // Store the ID before any state changes
      const commentId = newComment.id;

      // Check for MCP mentions in the comment content
      const mentions = extractMentionsFromDelta(contentDelta);
      const hasMCPMentions = mentions.some(
        (mention) => mention.type === MentionEntityType.MCP_SERVER,
      );

      // Now update state
      setErrorMsg(null);
      setContentDelta(createDeltaFromText(''));
      clearDraft();

      if (handleIsReplying) {
        handleIsReplying(false);
      }

      // Automatically trigger AI reply if MCP mentions are detected, regardless of AI toggle state
      const shouldTriggerAI = aiCommentsToggleEnabled || hasMCPMentions;

      // Notify parent about the new comment and its AI status
      onCommentCreated?.(commentId, shouldTriggerAI);

      return commentId;
    } catch (err) {
      if (err instanceof SessionKeyError) {
        checkForSessionKeyRevalidationErrors(err);
        throw err;
      }
      const errMsg = err?.responseJSON?.error || err?.message;
      console.error('CreateComment - Error:', errMsg);

      notifyError('Failed to create comment');
      setErrorMsg(errMsg);
      throw err;
    } finally {
      setSendingComment(false);
    }
  };

  const disabled = editorValue.length === 0 || sendingComment;

  const handleCancel = (event: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    setContentDelta(createDeltaFromText(''));

    if (handleIsReplying) {
      handleIsReplying(false);
    }
    clearDraft();
    onCancel?.(event);
  };

  // on content updated, save draft
  useEffect(() => {
    saveDraft(contentDelta);
  }, [handleIsReplying, saveDraft, contentDelta]);

  return rootThread.archivedAt === null ? (
    <StickyInput
      parentType={parentType}
      canComment={canComment}
      handleSubmitComment={handleSubmitComment}
      errorMsg={errorMsg ?? ''}
      contentDelta={contentDelta}
      setContentDelta={setContentDelta}
      disabled={disabled}
      onCancel={handleCancel}
      author={author as Account}
      editorValue={editorValue}
      tooltipText={tooltipText}
      isReplying={isReplying}
      handleIsReplying={handleIsReplying}
      replyingToAuthor={replyingToAuthor}
      thread={rootThread}
      parentCommentText={parentCommentText}
      communityId={app.activeChainId() || ''}
    />
  ) : (
    <ArchiveMsg archivedAt={rootThread.archivedAt!} />
  );
};
