/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'pages/view_proposal/poll_editor_card.scss';

export class PollEditorCard
  implements
    m.ClassComponent<{
      proposal;
      openPollEditor: () => void;
    }>
{
  view(vnode) {
    const { proposal, openPollEditor } = vnode.attrs;

    return (
      <div class="PollEditorCard">
        <h4>Add an offchain poll to this thread?</h4>
        <Button
          rounded={true}
          compact={true}
          fluid={true}
          disabled={!!proposal.offchainVotingEndsAt}
          label={
            proposal.offchainVotingEndsAt ? 'Polling enabled' : 'Create a poll'
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
