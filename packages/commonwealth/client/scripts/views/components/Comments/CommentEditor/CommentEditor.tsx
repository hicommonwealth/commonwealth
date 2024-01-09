import Account from 'client/scripts/models/Account';
import clsx from 'clsx';
import type { DeltaStatic } from 'quill';
import React from 'react';
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
  disabled: boolean;
  onCancel: (e: any) => void;
  author: Account;
  editorValue: string;
  shouldFocus: boolean;
  tooltipText?: string;
};

export const CommentEditor = ({
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
  shouldFocus,
  tooltipText,
}: CommentEditorProps) => {
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
              userCommunityId={author?.community.id}
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
        tooltipLabel={tooltipText}
        shouldFocus={shouldFocus}
      />
      <div className="form-bottom">
        <div className="form-buttons">
          {editorValue.length > 0 && (
            <CWButton buttonType="tertiary" onClick={onCancel} label="Cancel" />
          )}
          <CWButton
            buttonWidth="wide"
            disabled={disabled}
            onClick={handleSubmitComment}
            label="Submit"
          />
        </div>
      </div>
    </div>
  );
};
