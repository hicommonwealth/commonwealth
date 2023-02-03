/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import $ from 'jquery';

import 'modals/linked_thread_modal.scss';

import type { Thread } from 'models';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { ThreadSelector } from 'views/components/thread_selector';
import { CWButton } from '../components/component_kit/cw_button';

type LinkedThreadModalAttrs = {
  linkedThreads: Thread[];
  linkingThread: Thread;
  onclose: () => null;
};

export class LinkedThreadModal extends ClassComponent<LinkedThreadModalAttrs> {
  view(vnode: ResultNode<LinkedThreadModalAttrs>) {
    const { linkingThread, linkedThreads, onclose } = vnode.attrs;

    return (
      <div className="LinkedThreadModal">
        <div className="compact-modal-title">
          <h3>Link to Existing Threads</h3>
          <ModalExitButton />
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
              if (onclose) onclose();
              $(e.target).trigger('modalexit');
            }}
          />
        </div>
      </div>
    );
  }
}
