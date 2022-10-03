/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/edit_comment.scss';

import app from 'state';
import { Comment } from 'models';
import { CWButton } from '../../components/component_kit/cw_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { clearEditingLocalStorage } from './helpers';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { QuillEditor } from '../../components/quill/quill_editor';
import { ContentType } from 'shared/types';

type EditCommentAttrs = {
  comment: Comment<any>;
  savedEdits?: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits?: boolean;
  updatedCommentsCallback?: () => void;
};

export class EditComment implements m.ClassComponent<EditCommentAttrs> {
  private quillEditorState: QuillEditor;
  private saving: boolean;

  view(vnode) {
    const {
      comment,
      savedEdits,
      setIsEditing,
      shouldRestoreEdits,
      updatedCommentsCallback,
    } = vnode.attrs;
    const body = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;
    return (
      <div class="EditComment">
        <QuillEditorComponent
          contentsDoc={body}
          oncreateBind={(state: QuillEditor) => {
            this.quillEditorState = state;
          }}
          imageUploader
          theme="snow"
          editorNamespace={`edit-comment-${comment.id}`}
        />
        <div class="buttons-row">
          <CWButton
            label="Cancel"
            disabled={this.saving}
            buttonType="secondary-blue"
            onclick={async (e) => {
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
                m.redraw();
              }
            }}
          />
          <CWButton
            label="Save"
            disabled={this.saving}
            onclick={(e) => {
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
