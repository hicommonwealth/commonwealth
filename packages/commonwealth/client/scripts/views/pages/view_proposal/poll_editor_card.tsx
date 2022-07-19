/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'pages/view_proposal/poll_editor_card.scss';
import { OffchainThread } from 'models';

export class PollEditorCard
  implements
    m.ClassComponent<{
      proposal: OffchainThread;
      proposalAlreadyHasPolling: boolean;
      openPollEditor: () => void;
    }>
{
  view(vnode) {
    const { proposal, proposalAlreadyHasPolling, openPollEditor } = vnode.attrs;

    return (
      <div class="PollEditorCard">
        <h4>
          Add {proposalAlreadyHasPolling ? 'an' : 'another'} offchain poll to
          this thread?
        </h4>
        <Button
          rounded={true}
          compact={true}
          fluid={true}
          disabled={!!proposal.offchainVotingEndsAt}
          label={
            proposal.offchainVotingEndsAt ? 'Polling enabled' : 'Create poll'
          }
          onclick={(e) => {
            e.preventDefault();
            openPollEditor();
          }}
        />
      </div>
    );
  }
}
