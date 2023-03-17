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
import { ReactQuillEditor } from '../../components/react_quill_editor';
import { parseDeltaString } from '../../components/react_quill_editor/utils';

type EditBodyProps = {
  savedEdits: string;
  setIsEditing: (status: boolean) => void;
  shouldRestoreEdits: boolean;
  thread: Thread;
  title: string;
};

export const EditBody = (props: EditBodyProps) => {

  const { shouldRestoreEdits, savedEdits, thread, setIsEditing, title } = props;

  const navigate = useCommonNavigate();

  const threadBody = (shouldRestoreEdits && savedEdits) ? savedEdits : thread.body;
  const body = parseDeltaString(threadBody)

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
      setIsEditing(false);
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      navigate(`/discussion/${thread.id}`);
    }
  }

  const save = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setSaving(true);

    try {
      await app.threads.edit(thread, JSON.stringify(contentDelta), title)
      setIsEditing(false);
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      navigate(`/discussion/${thread.id}`);
      notifySuccess('Thread successfully edited');
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false);
    }
  }

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
        <CWButton
          label="Save"
          disabled={saving}
          onClick={save}
        />
      </div>
    </div>
  );
};
