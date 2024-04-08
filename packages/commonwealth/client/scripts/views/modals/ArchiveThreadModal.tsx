import 'modals/ArchiveThreadModal.scss';
import React from 'react';
import app from 'state';
import { useEditThreadMutation } from 'state/api/threads';
import type Thread from '../../models/Thread';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';

import {
  notifyError,
  notifySuccess,
} from '../../controllers/app/notifications';

type ArchiveThreadModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const ArchiveThreadModal = ({
  onModalClose,
  thread,
}: ArchiveThreadModalProps) => {
  const { mutateAsync: editThread } = useEditThreadMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
    currentStage: thread.stage,
    currentTopicId: thread.topic.id,
  });

  const handleArchiveThread = async () => {
    editThread({
      threadId: thread.id,
      communityId: app.activeChainId(),
      archived: !thread.archivedAt,
      address: app.user?.activeAccount?.address,
      pinned: false,
    })
      .then(() => {
        notifySuccess(
          `Thread has been ${thread?.archivedAt ? 'unarchived' : 'archived'}!`,
        );
        onModalClose();
      })
      .catch(() => {
        notifyError(
          `Could not ${thread?.archivedAt ? 'unarchive' : 'archive'} thread.`,
        );
      });
  };

  return (
    <div className="ArchiveThreadModal">
      <div className="title">
        <CWText type="h4" fontWeight="semiBold">
          Confirm archive
        </CWText>
      </div>
      <div className="body">
        <div className="warning-text">
          <CWText className="top">
            Are you sure you want to archive this thread post?
          </CWText>

          <CWText className="middle">
            Archived posts are hidden from the main feed and can no longer be
            interacted with. Archiving will move the post to a new topic section
            titled &quot;Archived,&quot; which is still viewable by all
            community members.
          </CWText>

          <CWText>Note that you can always unarchive a post.</CWText>
        </div>

        <div className="actions">
          <CWButton
            buttonHeight="sm"
            label="Cancel"
            buttonType="secondary"
            onClick={onModalClose}
          />
          <CWButton
            buttonHeight="sm"
            label="Confirm"
            onClick={handleArchiveThread}
          />
        </div>
      </div>
    </div>
  );
};
