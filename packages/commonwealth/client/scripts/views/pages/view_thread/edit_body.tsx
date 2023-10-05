import React from 'react';

import type Thread from '../../../models/Thread';
import 'pages/view_thread/edit_body.scss';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import app from 'state';
import { ContentType } from 'types';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import type { DeltaStatic } from 'quill';
import { ReactQuillEditor } from '../../components/react_quill_editor';
import { deserializeDelta } from '../../components/react_quill_editor/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { useEditThreadMutation } from 'state/api/threads';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { SessionKeyError } from 'controllers/server/sessions';

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

  const {
    mutateAsync: editThread,
    reset: resetEditThreadMutation,
    error: editThreadError,
  } = useEditThreadMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id,
  });

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetEditThreadMutation,
    error: editThreadError,
  });

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
            buttonType: 'primary',
            buttonHeight: 'sm',
            onClick: () => {
              clearEditingLocalStorage(thread.id, ContentType.Thread);
              cancelEditing();
            },
          },
          {
            label: 'No',
            buttonType: 'secondary',
            buttonHeight: 'sm',
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
      await editThread({
        newBody: JSON.stringify(contentDelta) || thread.body,
        newTitle: title || thread.title,
        threadId: thread.id,
        authorProfile: app.user.activeAccount.profile,
        address: app.user.activeAccount.address,
        chainId: app.activeChainId(),
      });
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      notifySuccess('Thread successfully edited');
      threadUpdatedCallback(title, newBody);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        return;
      }
      console.error(err?.responseJSON?.error || err?.message);
      notifyError('Failed to edit thread');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
      {RevalidationModal}
    </>
  );
};
