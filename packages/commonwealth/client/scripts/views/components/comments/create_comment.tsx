import React, { useEffect, useMemo } from 'react';

import BN from 'bn.js';

import 'components/comments/create_comment.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { weiToTokens, getDecimals } from 'helpers';
import type { DeltaStatic } from 'quill';
import { Thread } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { User } from 'views/components/user/user';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { jumpHighlightComment } from './helpers';
import {
  createDeltaFromText,
  getTextFromDelta,
  ReactQuillEditor,
} from '../react_quill_editor';
import { serializeDelta } from '../react_quill_editor/utils';
import { useDraft } from 'hooks/useDraft';

type CreateCommmentProps = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  rootThread: Thread;
  updatedCommentsCallback: () => void;
};

export const CreateComment = ({
  handleIsReplying,
  parentCommentId,
  rootThread,
  updatedCommentsCallback,
}: CreateCommmentProps) => {
  const { saveDraft, restoreDraft, clearDraft } = useDraft<DeltaStatic>(
    `new-thread-comment-${rootThread.id}`
  );

  const restoredDraft = useMemo(() => {
    if (handleIsReplying) {
      return createDeltaFromText('');
    }
    return restoreDraft() || createDeltaFromText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(
    restoredDraft
  );

  const [sendingComment, setSendingComment] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const editorValue = getTextFromDelta(contentDelta);

  const author = app.user.activeAccount;

  const parentType = parentCommentId ? ContentType.Comment : ContentType.Thread;

  const handleSubmitComment = async () => {
    setErrorMsg(null);
    setSendingComment(true);

    const chainId = app.activeChainId();

    try {
      const res = await app.comments.create(
        author.address,
        rootThread.id,
        chainId,
        serializeDelta(contentDelta),
        parentCommentId
      );

      updatedCommentsCallback();
      setErrorMsg(null);

      // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
      // once we are receiving notifications from the websocket
      await app.user.notifications.refresh();

      setContentDelta(createDeltaFromText(''));
      clearDraft();

      jumpHighlightComment(res.id);
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Comment submission failed.');
      setErrorMsg(err.message);
    } finally {
      setSendingComment(false);

      if (handleIsReplying) {
        handleIsReplying(false);
      }
    }
  };

  const activeTopicName =
    rootThread instanceof Thread ? rootThread?.topic?.name : null;

  // token balance check if needed
  const tokenPostingThreshold: BN = TopicGateCheck.getTopicThreshold(
    activeTopicName
  );

  const userBalance: BN = TopicGateCheck.getUserBalance();
  const userFailsThreshold =
    tokenPostingThreshold?.gtn(0) &&
    userBalance?.gtn(0) &&
    userBalance.lt(tokenPostingThreshold);

  const disabled =
    editorValue.length === 0 || sendingComment || userFailsThreshold;

  const decimals = getDecimals(app.chain);

  const cancel = (e) => {
    e.preventDefault();
    setContentDelta(createDeltaFromText(''));
    if (handleIsReplying) {
      handleIsReplying(false);
    } else {
      clearDraft();
    }
  };

  // on content updated, save draft
  useEffect(() => {
    if (handleIsReplying) {
      return;
    }
    saveDraft(contentDelta);
  }, [handleIsReplying, saveDraft, contentDelta]);

  return (
    <div className="CreateComment">
      <div className="attribution-row">
        <div className="attribution-left-content">
          <CWText type="caption">
            {parentType === ContentType.Comment ? 'Reply as' : 'Comment as'}
          </CWText>
          <CWText type="caption" fontWeight="medium" className="user-link-text">
            <User user={author} hideAvatar linkify />
          </CWText>
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
      <ReactQuillEditor
        className="editor"
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
      />
      {tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0)) && (
        <CWText className="token-req-text">
          Commenting in {activeTopicName} requires{' '}
          {weiToTokens(tokenPostingThreshold.toString(), decimals)}{' '}
          {app.chain.meta.default_symbol}.{' '}
          {userBalance && app.user.activeAccount && (
            <>
              You have {weiToTokens(userBalance.toString(), decimals)}{' '}
              {app.chain.meta.default_symbol}.
            </>
          )}
        </CWText>
      )}
      <div className="form-bottom">
        <div className="form-buttons">
          {editorValue.length > 0 && (
            <CWButton
              buttonType="secondary-blue"
              onClick={cancel}
              label="Cancel"
            />
          )}
          <CWButton
            disabled={disabled}
            onClick={handleSubmitComment}
            label="Submit"
          />
        </div>
      </div>
    </div>
  );
};
