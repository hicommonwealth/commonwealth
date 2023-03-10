import React from 'react';

import 'components/comments/edit_comment.scss';
import type { Comment } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { CWButton } from '../component_kit/cw_button';
import type { QuillEditor } from '../quill/quill_editor';
import { QuillEditorComponent } from '../quill/quill_editor_component';
import { clearEditingLocalStorage } from './helpers';

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

  const [quillEditorState, setQuillEditorState] = React.useState<QuillEditor>();
  const [saving, setSaving] = React.useState<boolean>();

  const body = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;

  return (
    <div className="EditComment">
      {/* TODO: replace with ReactQuillEditor, but must fix bug preventing this parent component from rendering */}
      <QuillEditorComponent
        contentsDoc={body}
        oncreateBind={(state: QuillEditor) => {
          setQuillEditorState(state);
        }}
        imageUploader
        theme="snow"
        editorNamespace={`edit-comment-${comment.id}`}
      />
      <div className="buttons-row">
        <CWButton
          label="Cancel"
          disabled={saving}
          buttonType="secondary-blue"
          onClick={async (e) => {
            e.preventDefault();

            let confirmed = true;

            const commentText = quillEditorState.textContentsAsString;

            if (commentText !== body) {
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

            quillEditorState.disable();

            const itemText = quillEditorState.textContentsAsString;

            app.comments.edit(comment, itemText).then(() => {
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
