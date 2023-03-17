import React from 'react';

import type { Thread } from 'models';
import 'pages/view_thread/edit_body.scss';
import { notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { ContentType } from 'types';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import type { QuillEditor } from '../../components/quill/quill_editor';
import { QuillEditorComponent } from '../../components/quill/quill_editor_component';
import { useCommonNavigate } from 'navigation/helpers';

type EditBodyProps = {
  savedEdits: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits: boolean;
  thread: Thread;
  title: string;
};

export const EditBody = (props: EditBodyProps) => {
  const navigate = useCommonNavigate();
  const [quillEditorState, setQuillEditorState] = React.useState<QuillEditor>();
  const [saving, setSaving] = React.useState<boolean>(false);
  const { shouldRestoreEdits, savedEdits, thread, setIsEditing, title } = props;

  const body = shouldRestoreEdits && savedEdits ? savedEdits : thread.body;

  return (
    <div className="EditBody">
      <QuillEditorComponent
        contentsDoc={body}
        oncreateBind={(state: QuillEditor) => {
          setQuillEditorState(state);
        }}
        imageUploader
        theme="snow"
        editorNamespace={`edit-thread-${thread.id}`}
      />
      <div className="buttons-row">
        <CWButton
          label="Cancel"
          disabled={saving}
          buttonType="secondary-blue"
          onClick={async (e) => {
            e.preventDefault();

            let confirmed = true;

            const threadText = quillEditorState.textContentsAsString;

            if (threadText !== body) {
              confirmed = window.confirm(
                'Cancel editing? Changes will not be saved.'
              );
            }

            if (confirmed) {
              setIsEditing(false);
              clearEditingLocalStorage(thread.id, ContentType.Thread);
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

            app.threads.edit(thread, itemText, title).then(() => {
              navigate(`/discussion/${thread.id}`);
              setSaving(false);
              clearEditingLocalStorage(thread.id, ContentType.Thread);
              setIsEditing(false);
              notifySuccess('Thread successfully edited');
            });
          }}
        />
      </div>
    </div>
  );
};
