import { ContentType } from '@hicommonwealth/shared';
import { buildUpdateThreadInput } from 'client/scripts/state/api/threads/editThread';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import 'pages/view_thread/edit_body.scss';
import type { DeltaStatic } from 'quill';
import React from 'react';
import app from 'state';
import { useEditThreadMutation } from 'state/api/threads';
import useUserStore from 'state/ui/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import type Thread from '../../../models/Thread';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { ReactQuillEditor } from '../../components/react_quill_editor';
import { deserializeDelta } from '../../components/react_quill_editor/utils';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';

type EditBodyProps = {
  title: string;
  savedEdits: string;
  shouldRestoreEdits: boolean;
  thread: Omit<Thread, 'body'>;
  activeThreadBody: string; // body of the active/selected thread version
  cancelEditing: () => void;
  threadUpdatedCallback: (title: string, body: string) => void;
  isDisabled?: boolean;
};

export const EditBody = (props: EditBodyProps) => {
  const {
    title,
    shouldRestoreEdits,
    savedEdits,
    thread,
    activeThreadBody,
    cancelEditing,
    threadUpdatedCallback,
    isDisabled = false,
  } = props;

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const threadBody =
    shouldRestoreEdits && savedEdits ? savedEdits : activeThreadBody;
  const body = deserializeDelta(threadBody);

  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(body);
  const [saving, setSaving] = React.useState<boolean>(false);

  const user = useUserStore();

  const { mutateAsync: editThread } = useEditThreadMutation({
    threadMsgId: thread.canvasMsgId!,
    communityId: app.activeChainId() || '',
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic!.id!,
  });

  const cancel = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
        onClose: () => {
          return;
        },
      });
    } else {
      cancelEditing();
    }
  };

  const save = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setSaving(true);

    const asyncHandle = async () => {
      try {
        const newBody = JSON.stringify(contentDelta);
        const input = await buildUpdateThreadInput({
          newBody: JSON.stringify(contentDelta),
          newTitle: title || thread.title,
          threadId: thread.id,
          threadMsgId: thread.canvasMsgId!,
          authorProfile: user.activeAccount?.profile,
          address: user.activeAccount?.address || '',
          communityId: app.activeChainId() || '',
        });
        await editThread(input);
        clearEditingLocalStorage(thread.id, ContentType.Thread);
        notifySuccess('Thread successfully edited');
        threadUpdatedCallback(title, newBody);
      } catch (err) {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        console.error(err?.responseJSON?.error || err?.message);
        notifyError('Failed to edit thread');
      } finally {
        setSaving(false);
      }
    };

    asyncHandle().then().catch(console.error);
  };

  return (
    <div className="EditBody">
      <ReactQuillEditor
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        cancelEditing={cancelEditing}
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
          disabled={saving || isDisabled}
          onClick={save}
        />
      </div>
    </div>
  );
};
