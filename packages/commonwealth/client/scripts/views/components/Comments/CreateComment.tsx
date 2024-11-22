import { ContentType } from '@hicommonwealth/shared';
import { buildCreateCommentInput } from 'client/scripts/state/api/comments/createComment';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { useDraft } from 'hooks/useDraft';
import Account from 'models/Account';
import type { DeltaStatic } from 'quill';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useCreateCommentMutation } from 'state/api/comments';
import useUserStore from 'state/ui/user';
import { StickEditorContainer } from 'views/components/StickEditorContainer';
import Thread from '../../../models/Thread';
import { useFetchProfilesByAddressesQuery } from '../../../state/api/profiles/index';
import { jumpHighlightComment } from '../../pages/discussions/CommentTree/helpers';
import { createDeltaFromText, getTextFromDelta } from '../react_quill_editor';
import { serializeDelta } from '../react_quill_editor/utils';
import { ArchiveMsg } from './ArchiveMsg';

type CreateCommentProps = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  parentCommentMsgId?: string | null;
  rootThread: Thread;
  canComment: boolean;
  tooltipText?: string;
  isReplying?: boolean;
};

export const CreateComment = ({
  handleIsReplying,
  parentCommentId,
  parentCommentMsgId,
  rootThread,
  canComment,
  tooltipText = '',
  isReplying,
}: CreateCommentProps) => {
  const { saveDraft, restoreDraft, clearDraft } = useDraft<DeltaStatic>(
    !parentCommentId
      ? `new-thread-comment-${rootThread.id}`
      : `new-comment-reply-${parentCommentId}`,
  );

  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

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
    communityId: app.activeChainId(),
    existingNumberOfComments: rootThread.numberOfComments || 0,
  });

  const handleSubmitComment = () => {
    if (!user.activeAccount) return;

    setErrorMsg(null);
    setSendingComment(true);

    const communityId = app.activeChainId() || '';
    const asyncHandle = async () => {
      try {
        const input = await buildCreateCommentInput({
          communityId,
          address: user.activeAccount!.address,
          threadId: rootThread.id,
          threadMsgId: rootThread.canvasMsgId!,
          unescapedText: serializeDelta(contentDelta),
          parentCommentId: parentCommentId ?? null,
          parentCommentMsgId: parentCommentMsgId ?? null,
          existingNumberOfComments: rootThread.numberOfComments || 0,
        });
        const newComment = await createComment(input);

        setErrorMsg(null);
        setContentDelta(createDeltaFromText(''));
        clearDraft();

        setTimeout(() => {
          // Wait for dom to be updated before scrolling to comment
          jumpHighlightComment(newComment?.id as number);
        }, 100);
      } catch (err) {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        const errMsg = err?.responseJSON?.error || err?.message;
        console.error(errMsg);

        notifyError('Failed to create comment');
        setErrorMsg(errMsg);
      } finally {
        setSendingComment(false);

        if (handleIsReplying) {
          handleIsReplying(false);
        }
      }
    };

    asyncHandle().then().catch(console.error);
  };

  const disabled = editorValue.length === 0 || sendingComment;

  const handleCancel = (e) => {
    e.preventDefault();
    setContentDelta(createDeltaFromText(''));

    if (handleIsReplying) {
      handleIsReplying(false);
    }
    clearDraft();
  };

  // on content updated, save draft
  useEffect(() => {
    saveDraft(contentDelta);
  }, [handleIsReplying, saveDraft, contentDelta]);

  return rootThread.archivedAt === null ? (
    <StickEditorContainer
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
    />
  ) : (
    <ArchiveMsg archivedAt={rootThread.archivedAt!} />
  );
};
