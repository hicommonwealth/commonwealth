import React from 'react';

import 'components/comments/edit_comment.scss';
import type { Comment } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { CWButton } from '../component_kit/cw_button';
import { clearEditingLocalStorage } from './helpers';
import type { DeltaStatic } from 'quill';
import { ReactQuillEditor } from '../react_quill_editor';
import { deserializeDelta, serializeDelta } from '../react_quill_editor/utils';

type EditCommentProps = {
  comment: Comment<any>;
  savedEdits?: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits?: boolean;
  updatedCommentsCallback?: () => void;
};

export const EditComment = (props: EditCommentProps) => {
  const { comment, savedEdits, setIsEditing, shouldRestoreEdits, updatedCommentsCallback } = props;

  const commentBody = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;
  const body = deserializeDelta(commentBody);

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(body);
  const [saving, setSaving] = React.useState<boolean>();

  const cancel = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    let cancelConfirmed = true;

    if (JSON.stringify(body) !== JSON.stringify(contentDelta)) {
      cancelConfirmed = window.confirm('Cancel editing? Changes will not be saved.');
    }

    if (cancelConfirmed) {
      setIsEditing(false);
      clearEditingLocalStorage(comment.id, ContentType.Comment);
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
      <ReactQuillEditor contentDelta={contentDelta} setContentDelta={setContentDelta} />
      <div className="buttons-row">
        <CWButton label="Cancel" disabled={saving} buttonType="secondary-blue" onClick={cancel} />
        <CWButton label="Save" disabled={saving} onClick={save} />
      </div>
    </div>
  );
};
