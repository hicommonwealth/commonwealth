/* @jsx m */

import m from 'mithril';

import 'pages/view_thread/poll_editor_card.scss';

import app from 'state';
import { Thread } from 'models';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { PollEditorModal } from '../../modals/poll_editor_modal';

export class PollEditorCard
  implements
    m.ClassComponent<{
      thread: Thread;
      threadAlreadyHasPolling: boolean;
    }>
{
  view(vnode) {
    const { thread, threadAlreadyHasPolling } = vnode.attrs;

    return (
      <CWCard className="PollEditorCard">
        <CWText type="h5">
          Add {threadAlreadyHasPolling ? 'an' : 'another'} offchain poll to this
          thread?
        </CWText>
        <CWButton
          disabled={!!thread.offchainVotingEndsAt}
          label={thread.votingEndTime ? 'Polling enabled' : 'Create poll'}
          onclick={(e) => {
            e.preventDefault();
            app.modals.create({
              modal: PollEditorModal,
              data: {
                thread,
              },
            });
          }}
        />
      </CWCard>
    );
  }
}
