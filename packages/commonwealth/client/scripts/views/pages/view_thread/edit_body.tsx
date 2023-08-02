import React from 'react';

import type Thread from '../../../models/Thread';
import 'pages/view_thread/edit_body.scss';
import { notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { ContentType } from 'types';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import type { DeltaStatic } from 'quill';
import { ReactQuillEditor } from '../../components/react_quill_editor';
import { deserializeDelta } from '../../components/react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';

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

    const hasContentChanged =
      JSON.stringify(body) !== JSON.stringify(contentDelta);

    if (hasContentChanged) {
      openConfirmation({
        title: 'Cancel editing?',
        description: <>Changes will not be saved.</>,
        buttons: [
          {
            label: 'Yes',
            buttonType: 'mini-black',
            onClick: () => {
              clearEditingLocalStorage(thread.id, ContentType.Thread);
              cancelEditing();
            },
          },
          {
            label: 'No',
            buttonType: 'mini-white',
          },
        ],
      });
    } else {
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
          buttonType="tertiary"
          onClick={cancel}
        />
        <CWButton
          label="Save"
          buttonWidth="wide"
          disabled={saving}
          onClick={save}
        />
      </div>
    </div>
  );
};
