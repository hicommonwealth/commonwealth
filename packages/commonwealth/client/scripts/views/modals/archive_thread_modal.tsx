import React, { useState } from 'react';

import 'modals/change_thread_topic_modal.scss';
import type Thread from '../../models/Thread';
import type Topic from '../../models/Topic';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { TopicSelector } from '../components/topic_selector';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { useFetchTopicsQuery } from 'state/api/topics';

type ArchiveThreadModalProps = {
  onModalClose: () => void;
  thread: Thread;
};

export const ArchiveThreadModal = ({
  onModalClose,
  thread,
}: ArchiveThreadModalProps) => {
  const handleArchiveThread = async () => {
    try {
      await app.threads.archive(thread.id);
      onModalClose();
    } catch (err) {
      console.log('Failed to archive thread.');

      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to archive thread.'
      );
    }
  };

  return (
    <div className="ArchiveThreadModal">
      <div className="title">
        <CWText type="h4" fontWeight="semiBold">
          Confirm archive
        </CWText>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="body">
        <div className="warning-text">
          <CWText>
            Are you sure you want to archive this thread post?
          </CWText>
          <CWText>
            Archived posts are hidden from the main feed and can no longer be interacted with. Archiving will move the post to a new topic section titled "Archived," which is still viewabel by all community members.
          </CWText>
          <CWText>
            Note that you can always unarchive a post.
          </CWText>
        </div>

        <div className="actions">
          <CWButton
            label="Confirm"
            buttonType="secondary-red"
            onClick={handleArchiveThread}
          />
          <CWButton
            label="Cancel"
            buttonType="primary-black"
            onClick={onModalClose}
          />
        </div>
      </div>
    </div>
  );
};
