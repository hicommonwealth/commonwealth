import { notifySuccess } from 'controllers/app/notifications';

import 'pages/view_thread/edit_body.scss';
import type { DeltaStatic } from 'quill';
import React from 'react';
import app from 'state';
import { ContentType } from 'types';
import type Thread from '../../../models/Thread';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { ReactQuillEditor } from '../../components/react_quill_editor';
import { deserializeDelta } from '../../components/react_quill_editor/utils';

type EditBodyProps = {
  title: string;
  savedEdits: string;
  shouldRestoreEdits: boolean;
  thread: Thread;
  cancelEditing: () => void;
  threadUpdatedCallback: (title: string, body: string) => void;
};

export const EditBody = (props: EditBodyProps) => {
  const {
    title,
    shouldRestoreEdits,
    savedEdits,
    thread,
    cancelEditing,
    threadUpdatedCallback,
  } = props;

  const threadBody =
    shouldRestoreEdits && savedEdits ? savedEdits : thread.body;
  const body = deserializeDelta(threadBody);

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(body);
  const [saving, setSaving] = React.useState<boolean>(false);

  const cancel = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    let cancelConfirmed = true;

    if (JSON.stringify(body) !== JSON.stringify(contentDelta)) {
      cancelConfirmed = window.confirm(
        'Cancel editing? Changes will not be saved.'
      );
    }

    if (cancelConfirmed) {
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      cancelEditing();
    }
  };

  const save = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setSaving(true);

    try {
      const newBody = JSON.stringify(contentDelta);
      await app.threads.edit(thread, newBody, title);
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      notifySuccess('Thread successfully edited');
      threadUpdatedCallback(title, newBody);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
          onClick={cancel}
        />
        <CWButton label="Save" disabled={saving} onClick={save} />
      </div>
    </div>
  );
};
