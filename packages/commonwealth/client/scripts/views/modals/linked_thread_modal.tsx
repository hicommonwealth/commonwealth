/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'modals/linked_thread_modal.scss';

import type { Thread } from 'models';
import { ThreadSelector } from 'views/components/thread_selector';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type LinkedThreadModalProps = {
  linkedThreads: Thread[];
  linkingThread: Thread;
  onModalClose: () => void;
};

export const LinkedThreadModal = (props: LinkedThreadModalProps) => {
  const { linkingThread, linkedThreads, onModalClose } = props;

  return (
    <div className="LinkedThreadModal">
      <div className="compact-modal-title">
        <h3>Link to Existing Threads</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <ThreadSelector
          linkingThread={linkingThread}
          linkedThreads={linkedThreads}
        />
        <CWButton
          label="Close"
          onClick={(e) => {
            e.preventDefault();
            onModalClose();
          }}
        />
      </div>
    </div>
  );
};
