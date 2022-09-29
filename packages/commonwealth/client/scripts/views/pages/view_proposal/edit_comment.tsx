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

type EditCommentAttrs = {
  comment: Comment<any>;
  setIsEditing: (status: boolean) => void;
  updatedCommentsCallback?: () => void;
};

export class EditComment implements m.ClassComponent<EditCommentAttrs> {
  private quillEditorState: QuillEditor;
  private shouldRestoreEdits: boolean;
  private savedEdits: string;
  private saving: boolean;

  async oninit(vnode) {
    const { comment } = vnode.attrs;

    this.savedEdits = localStorage.getItem(
      `${app.activeChainId()}-edit-comment-${comment.id}-storedText`
    );

    if (this.savedEdits) {
      this.shouldRestoreEdits = await confirmationModalWithText(
        'Previous changes found. Restore edits?',
        'Yes',
        'No'
      )();

      clearEditingLocalStorage(comment, false);

      m.redraw();
    }
  }

  view(vnode) {
    const { updatedCommentsCallback, comment, setIsEditing } = vnode.attrs;

    const { shouldRestoreEdits, savedEdits } = this;

    const body = shouldRestoreEdits && savedEdits ? savedEdits : comment.text;

    return (
      <div class="EditComment">
        {savedEdits && shouldRestoreEdits === undefined ? (
          <QuillEditorComponent />
        ) : (
          <QuillEditorComponent
            contentsDoc={(() => {
              try {
                const doc = JSON.parse(body);
                if (!doc.ops) throw new Error();
                return doc;
              } catch (e) {
                return body;
              }
            })()}
            oncreateBind={(state) => {
              this.quillEditorState = state;
            }}
            imageUploader
            theme="snow"
            editorNamespace={`edit-comment-${comment.id}`}
          />
        )}
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

                clearEditingLocalStorage(comment, false);

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

                clearEditingLocalStorage(comment, false);

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
