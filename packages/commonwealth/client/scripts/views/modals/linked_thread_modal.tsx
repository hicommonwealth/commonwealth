/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Button } from 'construct-ui';

import 'modals/linked_thread_modal.scss';

import { OffchainThread } from 'models';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { ThreadSelector } from 'views/components/thread_selector';

type LinkedThreadModalAttrs = {
  linkedThreads: OffchainThread[];
  linkingThread: OffchainThread;
  onclose: () => null;
};

export class LinkedThreadModal
  implements m.ClassComponent<LinkedThreadModalAttrs>
{
  view(vnode) {
    const { linkingThread, linkedThreads, onclose } = vnode.attrs;

    return (
      <div class="LinkedThreadModal">
        <div class="compact-modal-title">
          <h3>Link to Existing Threads</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {m(ThreadSelector, {
            linkingThread,
            linkedThreads,
          })}
          <Button
            label="Close"
            intent="primary"
            onclick={(e) => {
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
