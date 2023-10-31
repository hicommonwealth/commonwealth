import BN from 'bn.js';
import Account from 'client/scripts/models/Account';
import clsx from 'clsx';
import { getDecimals, weiToTokens } from 'helpers';
import type { DeltaStatic } from 'quill';
import React from 'react';
import app from 'state';
import { ContentType } from 'types';
import { User } from 'views/components/user/user';
import { CWText } from '../../component_kit/cw_text';
import { CWValidationText } from '../../component_kit/cw_validation_text';
import { CWButton } from '../../component_kit/new_designs/cw_button';
import { ReactQuillEditor } from '../../react_quill_editor';
import './CommentEditor.scss';

type CommentEditorProps = {
  parentType: ContentType;
  canComment: boolean;
  handleSubmitComment: () => void;
  errorMsg: string;
  contentDelta: DeltaStatic;
  setContentDelta: React.Dispatch<React.SetStateAction<DeltaStatic>>;
  tokenPostingThreshold: BN;
  topicName: string;
  userBalance: BN;
  disabled: boolean;
  onCancel: (e: any) => void;
  isAdmin: boolean;
  author: Account;
  editorValue: string;
  shouldFocus: boolean;
};

export const CommentEditor = ({
  parentType,
  canComment,
  handleSubmitComment,
  errorMsg,
  contentDelta,
  setContentDelta,
  tokenPostingThreshold,
  topicName,
  userBalance,
  disabled,
  onCancel,
  isAdmin,
  author,
  editorValue,
  shouldFocus,
}: CommentEditorProps) => {
  const decimals = getDecimals(app.chain);

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
              userChainId={author?.community.id}
              shouldHideAvatar
              shouldLinkProfile
            />
          </CWText>
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
      <ReactQuillEditor
        className="editor"
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        isDisabled={!canComment}
        tooltipLabel="Join community to comment"
        shouldFocus={shouldFocus}
      />
      {tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0)) && (
        <CWText className="token-req-text">
          Commenting in {topicName} requires{' '}
          {weiToTokens(tokenPostingThreshold.toString(), decimals)}{' '}
          {app.chain.meta.default_symbol}.{' '}
          {userBalance && (
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
            <CWButton buttonType="tertiary" onClick={onCancel} label="Cancel" />
          )}
          <CWButton
            buttonWidth="wide"
            disabled={disabled && !isAdmin}
            onClick={handleSubmitComment}
            label="Submit"
          />
        </div>
      </div>
    </div>
  );
};
