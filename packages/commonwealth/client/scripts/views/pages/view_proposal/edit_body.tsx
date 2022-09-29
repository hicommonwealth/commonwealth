/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/edit_body.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { Thread } from 'models';
import { validURL } from 'utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { clearEditingLocalStorage } from './helpers';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { QuillEditor } from '../../components/quill/quill_editor';

type EditBodyAttrs = {
  thread: Thread;
  setIsEditing: (status: boolean) => void;
  updatedTitle: string;
  updatedUrl: string;
};

export class EditBody implements m.ClassComponent<EditBodyAttrs> {
  private quillEditorState: QuillEditor;
  private savedEdits: string;
  private saving: boolean;
  private shouldRestoreEdits: boolean;

  async oninit(vnode) {
    const { thread } = vnode.attrs;

    this.savedEdits = localStorage.getItem(
      `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
    );

    if (this.savedEdits) {
      this.shouldRestoreEdits = await confirmationModalWithText(
        'Previous changes found. Restore edits?',
        'Yes',
        'No'
      )();

      clearEditingLocalStorage(thread, true);

      m.redraw();
    }
  }

  view(vnode) {
    const { thread, setIsEditing, updatedTitle, updatedUrl } = vnode.attrs;

    const { shouldRestoreEdits, savedEdits } = this;

    const body = shouldRestoreEdits && savedEdits ? savedEdits : thread.body;

    return (
      <div class="EditBody">
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
            editorNamespace={`edit-thread-${thread.id}`}
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

              const threadText = this.quillEditorState.textContentsAsString;

              if (threadText !== body) {
                confirmed = await confirmationModalWithText(
                  'Cancel editing? Changes will not be saved.',
                  'Delete changes',
                  'Keep editing'
                )();
              }

              if (confirmed) {
                setIsEditing(false);

                clearEditingLocalStorage(thread, true);

                m.redraw();
              }
            }}
          />
          <CWButton
            label="Save"
            disabled={this.saving}
            onclick={(e) => {
              e.preventDefault();

              if (updatedUrl) {
                if (!validURL(updatedUrl)) {
                  notifyError('Must provide a valid URL.');
                  return;
                }
              }

              this.saving = true;

              this.quillEditorState.disable();

              const itemText = this.quillEditorState.textContentsAsString;

              app.threads
                .edit(thread, itemText, updatedTitle, updatedUrl)
                .then(() => {
                  navigateToSubpage(`/discussion/${thread.id}`);

                  this.saving = false;

                  clearEditingLocalStorage(thread, true);

                  setIsEditing(false);

                  m.redraw();

                  notifySuccess('Thread successfully edited');
                });
            }}
          />
        </div>
      </div>
    );
  }
}
