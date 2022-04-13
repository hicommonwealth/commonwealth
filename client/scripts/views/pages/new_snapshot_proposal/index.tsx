/* @jsx m */

import 'pages/new_proposal_page.scss';

import m from 'mithril';

import Sublayout from 'views/sublayout';
import NewProposalForm from './new_proposal_form';

type NewProposalSnapshotPageAttrs = { snapshotId: string };

class NewSnapshotProposalPage
  implements m.ClassComponent<NewProposalSnapshotPageAttrs>
{
  view(vnode) {
    return (
      <Sublayout title="New Snapshot Proposal" showNewProposalButton={true}>
        <div class="NewProposalPage">
          {m(NewProposalForm, { snapshotId: vnode.attrs.snapshotId })}
        </div>
      </Sublayout>
    );
  }
}

export default NewSnapshotProposalPage;
