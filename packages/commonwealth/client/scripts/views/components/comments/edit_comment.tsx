import React, { useEffect, useMemo } from 'react';

import 'components/comments/edit_comment.scss';
import type { Comment } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { CWButton } from '../component_kit/cw_button';
import { clearEditingLocalStorage } from './helpers';
import { DeltaStatic } from 'quill';
import { createDeltaFromText, ReactQuillEditor } from '../react_quill_editor';

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

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(createDeltaFromText(''));
  const [saving, setSaving] = React.useState<boolean>();

  const cancel = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    let cancelConfirmed = true;

    if (JSON.stringify(body) !== JSON.stringify(contentDelta)) {
      cancelConfirmed = window.confirm(
        'Cancel editing? Changes will not be saved.'
      );
    }

    if (cancelConfirmed) {
      setIsEditing(false);
      clearEditingLocalStorage(comment.id, ContentType.Comment);
    }
  }

  const save = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setSaving(true);

    try {
      await app.comments.edit(comment, JSON.stringify(contentDelta))
      setIsEditing(false);
      clearEditingLocalStorage(comment.id, ContentType.Comment);
      updatedCommentsCallback();
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false);
    }
    
  }

  // attempt to parse the comment text as JSON
  // since it might be a quill delta object
  const body = useMemo<DeltaStatic>(() => {
    const commentText = (shouldRestoreEdits && savedEdits) ? savedEdits : comment.text;
    try {
      return JSON.parse(commentText)
    } catch (e) {
      console.warn('failed to parse comment as JSON, falling back on string', e)
      return createDeltaFromText(commentText)
    }
  }, [shouldRestoreEdits, savedEdits, comment])

  // once body is parsed, set initial content delta
  useEffect(() => {
    setContentDelta(body)
  }, [body])

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
          buttonType="secondary-blue"
          onClick={cancel}
        />
        <CWButton
          label="Save"
          disabled={saving}
          onClick={save}
        />
      </div>
    </div>
  );
};
