import React, { useState } from 'react';

import { notifyError } from '../../controllers/app/notifications';
import { getAddedAndDeleted } from '../../helpers/threads';
import type Thread from '../../models/Thread';
import { LinkSource } from '../../models/Thread';
import app from '../../state';
import {
  useAddThreadLinksMutation,
  useDeleteThreadLinksMutation,
} from '../../state/api/threads';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { ThreadSelector } from '../components/thread_selector';

type LinkedThreadModalProps = {
  linkedThreads: Thread[];
  thread: Thread;
  onModalClose: () => void;
  onSave?: (links: Thread['links']) => void;
};

export const LinkedThreadModal = ({
  thread,
  linkedThreads: initialLinkedThreads = [],
  onModalClose,
  onSave,
}: LinkedThreadModalProps) => {
  const [tempLinkedThreads, setTempLinkedThreads] =
    useState<Array<Thread>>(initialLinkedThreads);

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    communityId: app.activeChainId(),
    threadId: thread.id,
  });

  const handleSaveChanges = async () => {
    const { toAdd, toDelete } = getAddedAndDeleted(
      tempLinkedThreads,
      initialLinkedThreads,
    );
    let links: Thread['links'];
    try {
      if (toAdd.length) {
        const updatedThread = await addThreadLinks({
          communityId: app.activeChainId(),
          threadId: thread.id,
          links: toAdd.map((el) => ({
            source: LinkSource.Thread,
            identifier: String(el.id),
            title: el.title,
          })),
        });
        links = updatedThread.links;
      }
      if (toDelete.length) {
        const updatedThread = await deleteThreadLinks({
          communityId: app.activeChainId(),
          threadId: thread.id,
          links: toDelete.map((el) => ({
            source: LinkSource.Thread,
            identifier: String(el.id),
          })),
        });
        links = updatedThread.links;
      }
      onModalClose();
      if (links && onSave) {
        onSave(links);
      }
    } catch (err) {
      console.error(err);
      notifyError('Failed to update linked threads');
      onModalClose();
    }
  };

  const handleSelectThread = (selectedThread: Thread) => {
    const isSelected = tempLinkedThreads.find(
      ({ id }) => selectedThread.id === id,
    );
    const updatedLinkedThreads = isSelected
      ? tempLinkedThreads.filter(({ id }) => selectedThread.id !== id)
      : [...tempLinkedThreads, selectedThread];
    setTempLinkedThreads(updatedLinkedThreads);
  };

  return (
    <div className="LinkedThreadModal">
      <CWModalHeader
        label="Link to Existing Threads"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <ThreadSelector
          linkedThreadsToSet={tempLinkedThreads}
          onSelect={handleSelectThread}
        />
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onModalClose}
        />
        <CWButton
          label="Save changes"
          buttonType="primary"
          buttonHeight="sm"
          onClick={handleSaveChanges}
        />
      </CWModalFooter>
    </div>
  );
};
