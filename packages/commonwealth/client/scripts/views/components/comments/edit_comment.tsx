import React from 'react';

import 'components/comments/edit_comment.scss';
import type { Comment } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { CWButton } from '../component_kit/cw_button';
import { clearEditingLocalStorage } from './helpers';
import { DeltaStatic } from 'quill';
import { createDeltaFromText, getTextFromDelta, ReactQuillEditor } from '../react_quill_editor';

type EditCommentProps = {
  comment: Comment<any>;
  savedEdits?: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits?: boolean;
  updatedCommentsCallback?: () => void;
};

export const EditComment = (props: EditCommentProps) => {
  const {
    comment,
    savedEdits,
    setIsEditing,
    shouldRestoreEdits,
    updatedCommentsCallback,
  } = props;

  const body = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(createDeltaFromText(body));
  const [saving, setSaving] = React.useState<boolean>();

  const editorValue = getTextFromDelta(contentDelta);

  return (
    <div className="EditComment">
      <ReactQuillEditor
        theme='snow'
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
      />
      <div className="buttons-row">
        <CWButton
          label="Cancel"
          disabled={saving}
          buttonType="secondary-blue"
          onClick={async (e) => {
            e.preventDefault();

            let confirmed = true;

            if (editorValue !== body) {
              confirmed = window.confirm(
                'Cancel editing? Changes will not be saved.'
              );
            }

            if (confirmed) {
              setIsEditing(false);
              clearEditingLocalStorage(comment.id, ContentType.Comment);
            }
          }}
        />
        <CWButton
          label="Save"
          disabled={saving}
          onClick={(e) => {
            e.preventDefault();

            setSaving(true);

            app.comments.edit(comment, editorValue).then(() => {
              setSaving(false);
              clearEditingLocalStorage(comment.id, ContentType.Comment);
              setIsEditing(false);
              updatedCommentsCallback();
            });
          }}
        />
      </div>
    </div>
  );
};
