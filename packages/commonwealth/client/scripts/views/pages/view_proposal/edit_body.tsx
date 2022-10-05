/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/edit_body.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { notifySuccess } from 'controllers/app/notifications';
import { Thread } from 'models';
import { ContentType } from 'types';
import { CWButton } from '../../components/component_kit/cw_button';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { clearEditingLocalStorage } from './helpers';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { QuillEditor } from '../../components/quill/quill_editor';

type EditBodyAttrs = {
  thread: Thread;
  setIsEditing: (status: boolean) => void;
  title: string;
};

export class EditBody implements m.ClassComponent<EditBodyAttrs> {
  private quillEditorState: QuillEditor;
  private saving: boolean;

  view(vnode) {
    const { shouldRestoreEdits, savedEdits, thread, setIsEditing, title } =
      vnode.attrs;

    const body = shouldRestoreEdits && savedEdits ? savedEdits : thread.body;

    return (
      <div class="EditBody">
        <QuillEditorComponent
          contentsDoc={body}
          oncreateBind={(state: QuillEditor) => {
            this.quillEditorState = state;
          }}
          imageUploader
          theme="snow"
          editorNamespace={`edit-thread-${thread.id}`}
        />
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
                clearEditingLocalStorage(thread.id, ContentType.Thread);
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

              app.threads.edit(thread, itemText, title).then(() => {
                navigateToSubpage(`/discussion/${thread.id}`);
                this.saving = false;
                clearEditingLocalStorage(thread.id, ContentType.Thread);
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
