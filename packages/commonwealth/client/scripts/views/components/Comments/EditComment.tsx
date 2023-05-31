import React, { useState } from 'react';

import 'components/Comments/EditComment.scss';
import type Comment from '../../../models/Comment';

import app from 'state';
import { ContentType } from 'types';
import { CWButton } from '../component_kit/cw_button';
import { clearEditingLocalStorage } from './helpers';
import type { DeltaStatic } from 'quill';
import { ReactQuillEditor } from '../react_quill_editor';
import { deserializeDelta, serializeDelta } from '../react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';

type EditCommentProps = {
  comment: Comment<any>;
  savedEdits?: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits?: boolean;
  updatedCommentsCallback?: () => void;
};

export const EditComment = ({
  comment,
  savedEdits,
  setIsEditing,
  shouldRestoreEdits,
  updatedCommentsCallback,
}: EditCommentProps) => {
  const commentBody =
    shouldRestoreEdits && savedEdits ? savedEdits : comment.text;
  const body = deserializeDelta(commentBody);

  const [contentDelta, setContentDelta] = useState<DeltaStatic>(body);
  const [saving, setSaving] = useState<boolean>();

  const cancel = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    const hasContentChanged =
      JSON.stringify(body) !== JSON.stringify(contentDelta);

    if (hasContentChanged) {
      openConfirmation({
        title: 'Cancel editing?',
        description: <>Changes will not be saved.</>,
        buttons: [
          {
            label: 'Yes',
            buttonType: 'primary',
            onClick: () => {
              setIsEditing(false);
              clearEditingLocalStorage(comment.id, ContentType.Comment);
            },
          },
          {
            label: 'No',
            buttonType: 'secondary',
          },
        ],
      });
    } else {
      setIsEditing(false);
    }
  };

  const save = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setSaving(true);

    try {
      await app.comments.edit(comment, serializeDelta(contentDelta));
      setIsEditing(false);
      clearEditingLocalStorage(comment.id, ContentType.Comment);
      updatedCommentsCallback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="EditComment">
      <ReactQuillEditor
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
      />
      <div className="buttons-row">
        <CWButton
          label="Cancel"
          disabled={saving}
          buttonType="secondary"
          onClick={cancel}
        />
        <CWButton 
          buttonType="primary"
          label="Save"
          disabled={saving}
          onClick={save}
        />
      </div>
    </div>
  );
};
