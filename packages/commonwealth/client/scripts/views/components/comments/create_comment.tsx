import React from 'react';

import { redraw } from 'mithrilInterop';
import BN from 'bn.js';

import 'components/comments/create_comment.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { weiToTokens, getDecimals } from 'helpers';
import type { AnyProposal } from 'models';
import { Thread } from 'models';

import app from 'state';
import { ContentType } from 'types';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { User } from 'views/components/user/user';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { jumpHighlightComment } from './helpers';

type CreateCommmentProps = {
  handleIsReplying?: (isReplying: boolean, id?: number) => void;
  parentCommentId?: number;
  rootProposal: AnyProposal | Thread;
  updatedCommentsCallback: () => void;
};

export const CreateComment = (props: CreateCommmentProps) => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [quillEditorState, setQuillEditorState] =
    React.useState<QuillEditor | null>(null);
  const [sendingComment, setSendingComment] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const {
    handleIsReplying,
    parentCommentId,
    rootProposal,
    updatedCommentsCallback,
  } = props;

  const author = app.user.activeAccount;

  const parentType = parentCommentId ? ContentType.Comment : ContentType.Thread;

  const handleSubmitComment = async (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!quillEditorState) {
      if (e) e.preventDefault();
      setErrorMsg('Editor not initialized, please try again');
      return;
    }

    const commentText = quillEditorState.textContentsAsString;

    setErrorMsg(null);

    setSendingComment(true);

    quillEditorState.disable();

    const chainId = app.activeChainId();

    try {
      const res = await app.comments.create(
        author.address,
        rootProposal.uniqueIdentifier,
        chainId,
        commentText,
        parentCommentId
      );

      updatedCommentsCallback();

      quillEditorState.resetEditor();

      setErrorMsg(null);

      setSendingComment(false);

      // TODO: Instead of completely refreshing notifications, just add the comment to subscriptions
      // once we are receiving notifications from the websocket
      await app.user.notifications.refresh();

      redraw();

      jumpHighlightComment(res.id);
    } catch (err) {
      console.log(err);

      notifyError(err.message || 'Comment submission failed.');

      quillEditorState.enable();

      setErrorMsg(err.message);

      setSendingComment(false);

      redraw();
    }

    if (handleIsReplying) {
      handleIsReplying(false);
    }
    redraw();
  };

  const activeTopicName =
    rootProposal instanceof Thread ? rootProposal?.topic?.name : null;

  // token balance check if needed
  const tokenPostingThreshold: BN =
    TopicGateCheck.getTopicThreshold(activeTopicName);

  const userBalance: BN = TopicGateCheck.getUserBalance();
  const userFailsThreshold =
    tokenPostingThreshold?.gtn(0) &&
    userBalance?.gtn(0) &&
    userBalance.lt(tokenPostingThreshold);

  const disabled =
    quillEditorState?.isBlank() || sendingComment || userFailsThreshold;

  const decimals = getDecimals(app.chain);

  return (
    <div className="CreateComment">
      <div className="attribution-row">
        <div className="attribution-left-content">
          <CWText type="caption">
            {parentType === ContentType.Comment ? 'Reply as' : 'Comment as'}
          </CWText>
          <CWText
            type="caption"
            fontWeight="medium"
            className="user-link-text"
          >
            <User user={author} hideAvatar linkify />
          </CWText>
        </div>
        {errorMsg && (
          <CWValidationText message={errorMsg} status="failure" />
        )}
      </div>
      <QuillEditorComponent
        contentsDoc=""
        oncreateBind={(state: QuillEditor) => {
          setQuillEditorState(state);
        }}
        editorNamespace={`${document.location.pathname}-commenting`}
        imageUploader
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
      <div
        className="form-bottom"
        onMouseOver={() => {
          // keeps Quill's isBlank up to date
          return redraw();
        }}
      >
        <div className="form-buttons">
          <CWButton
            disabled={
              !handleIsReplying ? quillEditorState?.isBlank() : undefined
            }
            buttonType="secondary-blue"
            onClick={(e) => {
              e.preventDefault();

              if (handleIsReplying) {
                handleIsReplying(false);
              }
            }}
            label="Cancel"
          />
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
