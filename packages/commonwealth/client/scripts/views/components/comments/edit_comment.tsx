/* @jsx jsx */
import React from 'react';

import type { ResultNode} from 'mithrilInterop';
import { ClassComponent, redraw, jsx } from 'mithrilInterop';

import 'components/comments/edit_comment.scss';
import type { Comment } from 'models';

import app from 'state';
import { ContentType } from 'types';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { CWButton } from '../component_kit/cw_button';
import type { QuillEditor } from '../quill/quill_editor';
import { QuillEditorComponent } from '../quill/quill_editor_component';
import { clearEditingLocalStorage } from './helpers';

type EditCommentAttrs = {
  comment: Comment<any>;
  savedEdits?: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits?: boolean;
  updatedCommentsCallback?: () => void;
};

export class EditComment extends ClassComponent<EditCommentAttrs> {
  private quillEditorState: QuillEditor;
  private saving: boolean;

  view(vnode: ResultNode<EditCommentAttrs>) {
    const {
      comment,
      savedEdits,
      setIsEditing,
      shouldRestoreEdits,
      updatedCommentsCallback,
    } = vnode.attrs;

    const body = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;

    return (
      <div className="EditComment">
        <QuillEditorComponent
          contentsDoc={body}
          oncreateBind={(state: QuillEditor) => {
            this.quillEditorState = state;
          }}
          imageUploader
          theme="snow"
          editorNamespace={`edit-comment-${comment.id}`}
        />
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            disabled={this.saving}
            buttonType="secondary-blue"
            onClick={async (e) => {
              e.preventDefault();

              let confirmed = true;

              const commentText = this.quillEditorState.textContentsAsString;

              if (commentText !== body) {
                confirmed = await confirmationModalWithText(
                  'Cancel editing? Changes will not be saved.',
                  'Delete changes',
                  'Keep editing'
                )();
              }

              if (confirmed) {
                setIsEditing(false);
                clearEditingLocalStorage(comment.id, ContentType.Comment);
                redraw();
              }
            }}
          />
          <CWButton
            label="Save"
            disabled={this.saving}
            onClick={(e) => {
              e.preventDefault();

              this.saving = true;

              this.quillEditorState.disable();

              const itemText = this.quillEditorState.textContentsAsString;

              app.comments.edit(comment, itemText).then(() => {
                this.saving = false;
                clearEditingLocalStorage(comment.id, ContentType.Comment);
                setIsEditing(false);
                updatedCommentsCallback();
              });
            }}
          />
        </div>
      </div>
    );
  }
}
