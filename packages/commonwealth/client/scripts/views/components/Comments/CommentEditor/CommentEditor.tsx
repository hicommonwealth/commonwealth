import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { User } from 'views/components/user/user';
import Topic from 'client/scripts/models/Topic';
import Account from 'client/scripts/models/Account';
import app from 'state';
import clsx from 'clsx';
import { ReactQuillEditor } from '../../react_quill_editor';
import { CWButton } from '../../component_kit/new_designs/cw_button';
import { CWValidationText } from '../../component_kit/cw_validation_text';
import BN from 'bn.js';
import { weiToTokens, getDecimals } from 'helpers';
import { ContentType } from 'types';
import type { DeltaStatic } from 'quill';

type CommentEditorProps = {
  parentType: ContentType;
  canComment: boolean;
  handleSubmitComment: () => void;
  errorMsg: string;
  contentDelta: DeltaStatic;
  setContentDelta: React.Dispatch<React.SetStateAction<DeltaStatic>>;
  tokenPostingThreshold: BN;
  activeTopic: Topic;
  userBalance: BN;
  disabled: boolean;
  cancel: (e: any) => void;
  author: Account;
  editorValue: string;
};

export const CommentEditor = ({ 
  parentType,
  canComment,
  handleSubmitComment,
  errorMsg,
  contentDelta,
  setContentDelta,
  tokenPostingThreshold,
  activeTopic,
  userBalance,
  disabled,
  cancel,
  isAdmin,
  author,
  editorValue,
}) => {

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
            className={clsx('user-link-text', { disabled: !canComment })}
          >
            <User user={author} hideAvatar linkify />
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
      />
      {tokenPostingThreshold && tokenPostingThreshold.gt(new BN(0)) && (
        <CWText className="token-req-text">
          Commenting in {activeTopic?.name} requires{' '}
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
            <CWButton buttonType="tertiary" onClick={cancel} label="Cancel" />
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
  )
}
