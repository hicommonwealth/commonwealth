import React, { useState, useEffect, useMemo } from 'react';

import BN from 'bn.js';

import 'components/Comments/CreateComment.scss';
import { notifyError } from 'controllers/app/notifications';
import type { DeltaStatic } from 'quill';
import Thread from '../../../models/Thread';

import app from 'state';
import { ContentType } from 'types';
import { CommentEditor } from './CommentEditor/CommentEditor';
import { ArchiveMsg } from './ArchiveMsg/ArchiveMsg';
import { jumpHighlightComment } from '../../pages/discussions/CommentTree/helpers';
import {
  createDeltaFromText,
  getTextFromDelta,

} from '../react_quill_editor';
import { serializeDelta } from '../react_quill_editor/utils';
import { useDraft } from 'hooks/useDraft';
import { useCreateCommentMutation } from 'state/api/comments';
import Permissions from '../../../utils/Permissions';
import { getTokenBalance } from 'helpers/token_balance_helper';

type CreateCommentProps = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  rootThread: Thread;
  canComment: boolean;
};

export const CreateComment = ({
  handleIsReplying,
  parentCommentId,
  rootThread,
  canComment,
}: CreateCommentProps) => {
  const { saveDraft, restoreDraft, clearDraft } = useDraft<DeltaStatic>(
    !parentCommentId
      ? `new-thread-comment-${rootThread.id}`
      : `new-comment-reply-${parentCommentId}`
  );

  // get restored draft on init
  const restoredDraft = useMemo(() => {
    return restoreDraft() || createDeltaFromText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [contentDelta, setContentDelta] = useState<DeltaStatic>(restoredDraft);

  const [sendingComment, setSendingComment] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tokenPostingThreshold, setTokenPostingThreshold] = useState(
    new BN('0')
  );
  const [userBalance, setUserBalance] = useState(new BN('0'));
  const [balanceLoading, setBalanceLoading] = useState(false);
  const editorValue = getTextFromDelta(contentDelta);

  const author = app.user.activeAccount;

  const parentType = parentCommentId ? ContentType.Comment : ContentType.Thread;
  const activeTopic = rootThread instanceof Thread ? rootThread?.topic : null;

  useEffect(() => {
    activeTopic?.id &&
      setTokenPostingThreshold(app.chain.getTopicThreshold(activeTopic?.id));
  }, [activeTopic]);

  useEffect(() => {
    if (!tokenPostingThreshold.isZero() && !balanceLoading) {
      setBalanceLoading(true);
      if (!app.user.activeAccount?.tokenBalance) {
        getTokenBalance().then(() => {
          setUserBalance(app.user.activeAccount?.tokenBalance);
        });
      } else {
        setUserBalance(app.user.activeAccount?.tokenBalance);
      }
    }
  }, [tokenPostingThreshold]);

  const { mutateAsync: createComment } = useCreateCommentMutation({
    threadId: rootThread.id,
    chainId: app.activeChainId(),
    existingNumberOfComments: rootThread.numberOfComments || 0,
  });

  const handleSubmitComment = async () => {
    setErrorMsg(null);
    setSendingComment(true);

    const chainId = app.activeChainId();

    try {
      const newComment: any = await createComment({
        threadId: rootThread.id,
        chainId: chainId,
        address: author.address,
        parentCommentId: parentCommentId,
        unescapedText: serializeDelta(contentDelta),
        existingNumberOfComments: rootThread.numberOfComments || 0,
      });

      setErrorMsg(null);
      setContentDelta(createDeltaFromText(''));
      clearDraft();

      setTimeout(() => {
        // Wait for dom to be updated before scrolling to comment
        jumpHighlightComment(newComment.id);
      }, 100);

      // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
      // once we are receiving notifications from the websocket
      await app.user.notifications.refresh();
    } catch (err) {
      const errMsg = err?.responseJSON?.error || 'Failed to create comment';
      notifyError(errMsg);
      setErrorMsg(errMsg);
    } finally {
      setSendingComment(false);

      if (handleIsReplying) {
        handleIsReplying(false);
      }
    }
  };

  const userFailsThreshold = app.chain.isGatedTopic(activeTopic?.id);
  const isAdmin = Permissions.isCommunityAdmin();
  const disabled =
    editorValue.length === 0 ||
    sendingComment ||
    userFailsThreshold ||
    !canComment;

  const cancel = (e) => {
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

  return (
    <>
      { rootThread.archivedAt === null ? (
        <CommentEditor
          parentType={parentType}
          canComment={canComment}
          handleSubmitComment={handleSubmitComment}
          errorMsg={errorMsg}
          contentDelta={contentDelta}
          setContentDelta={setContentDelta}
          tokenPostingThreshold={tokenPostingThreshold}
          activeTopic={activeTopic}
          userBalance={userBalance}
          disabled={disabled}
          cancel={cancel}
          isAdmin={isAdmin}
          author={author}
          editorValue={editorValue}
        />
      ): (
            <ArchiveMsg
              archivedAt={rootThread.archivedAt}
            />
          )
        }
    </>

  );
};


