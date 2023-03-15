import React from 'react';

import type { Thread } from 'models';
import 'pages/view_thread/edit_body.scss';
import { notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { ContentType } from 'types';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { createDeltaFromText, getTextFromDelta, ReactQuillEditor } from '../../components/react_quill_editor';

type EditBodyProps = {
  savedEdits: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits: boolean;
  thread: Thread;
  title: string;
};

export const EditBody = (props: EditBodyProps) => {

  const { shouldRestoreEdits, savedEdits, thread, setIsEditing, title } = props;
  const body = shouldRestoreEdits && savedEdits ? savedEdits : thread.body;

  const navigate = useCommonNavigate();
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(createDeltaFromText(body));
  const [saving, setSaving] = React.useState<boolean>(false);
  
  const editorValue = getTextFromDelta(contentDelta);

  return (
    <div className="EditBody">
      <ReactQuillEditor
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
      />
      <div className="buttons-row">
        <CWButton
          label="Cancel"
          disabled={saving}
          buttonType="secondary-blue"
          onClick={async (e) => {
            e.preventDefault();

            let confirmed = true;

            if (editorValue !== body) {
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

            app.threads.edit(thread, editorValue, title).then(() => {
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
