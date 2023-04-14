import { notifyError } from 'controllers/app/notifications';

import 'modals/linked_thread_modal.scss';
import React, { useState } from 'react';
import app from 'state';

import { ThreadSelector } from 'views/components/thread_selector';
import type Thread from '../../models/Thread';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type LinkedThreadModalProps = {
  linkedThreads: Thread[];
  thread: Thread;
  onModalClose: () => void;
  onSave?: (linkedThreads: Thread[]) => void;
};

const getAddedAndDeleted = (
  tempLinkedThreads: Thread[],
  initialLinkedThreads: Thread[]
) => {
  const toAdd = tempLinkedThreads.reduce((acc, curr) => {
    const wasSelected = initialLinkedThreads.find(({ id }) => curr.id === id);

    if (wasSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  const toDelete = initialLinkedThreads.reduce((acc, curr) => {
    const isSelected = tempLinkedThreads.find(({ id }) => curr.id === id);

    if (isSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  return { toAdd, toDelete };
};

export const LinkedThreadModal = ({
  thread,
  linkedThreads: initialLinkedThreads = [],
  onModalClose,
  onSave,
}: LinkedThreadModalProps) => {
  const [tempLinkedThreads, setTempLinkedThreads] =
    useState<Array<Thread>>(initialLinkedThreads);

  const handleSaveChanges = async () => {
    const { toAdd, toDelete } = getAddedAndDeleted(
      tempLinkedThreads,
      initialLinkedThreads
    );

    try {
      if (toAdd.length) {
        await Promise.all(
          toAdd.map((linkedThread) =>
            app.threads.addLinkedThread(thread.id, linkedThread.id)
          )
        );
      }

      if (toDelete.length) {
        await Promise.all(
          toDelete.map((linkedThread) =>
            app.threads.removeLinkedThread(thread.id, linkedThread.id)
          )
        );
      }

      onModalClose();
      onSave(tempLinkedThreads);
    } catch (err) {
      console.error(err);
      notifyError('Failed to update linked threads');
      onModalClose();
    }
  };

  const handleSelectThread = (selectedThread: Thread) => {
    const isSelected = tempLinkedThreads.find(
      ({ id }) => selectedThread.id === id
    );

    const updatedLinkedThreads = isSelected
      ? tempLinkedThreads.filter(({ id }) => selectedThread.id !== id)
      : [...tempLinkedThreads, selectedThread];

    setTempLinkedThreads(updatedLinkedThreads);
  };

  return (
    <div className="LinkedThreadModal">
      <div className="compact-modal-title">
        <h3>Link to Existing Threads</h3>
        <CWIconButton iconName="close" onClick={onModalClose} />
      </div>
      <div className="compact-modal-body">
        <ThreadSelector
          linkedThreadsToSet={tempLinkedThreads}
          onSelect={handleSelectThread}
        />

        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onModalClose}
          />
          <CWButton label="Save changes" onClick={handleSaveChanges} />
        </div>
      </div>
    </div>
  );
};
