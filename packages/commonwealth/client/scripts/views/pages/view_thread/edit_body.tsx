import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';
import type { Thread } from 'models';
import 'pages/view_thread/edit_body.scss';
import { notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { ContentType } from 'types';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import type { QuillEditor } from '../../components/quill/quill_editor';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { navigateToSubpage } from 'router';

type EditBodyAttrs = {
  savedEdits: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits: boolean;
  thread: Thread;
  title: string;
};

export class EditBody extends ClassComponent<EditBodyAttrs> {
  private quillEditorState: QuillEditor;
  private saving: boolean;

  view(vnode: ResultNode<EditBodyAttrs>) {
    const { shouldRestoreEdits, savedEdits, thread, setIsEditing, title } =
      vnode.attrs;

    const body = shouldRestoreEdits && savedEdits ? savedEdits : thread.body;

    return (
      <div className="EditBody">
        <QuillEditorComponent
          contentsDoc={body}
          oncreateBind={(state: QuillEditor) => {
            this.quillEditorState = state;
          }}
          imageUploader
          theme="snow"
          editorNamespace={`edit-thread-${thread.id}`}
        />
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            disabled={this.saving}
            buttonType="secondary-blue"
            onClick={async (e) => {
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

              app.threads.edit(thread, itemText, title).then(() => {
                navigateToSubpage(`/discussion/${thread.id}`);
                this.saving = false;
                clearEditingLocalStorage(thread.id, ContentType.Thread);
                setIsEditing(false);
                redraw();
                notifySuccess('Thread successfully edited');
              });
            }}
          />
        </div>
      </div>
    );
  }
}
