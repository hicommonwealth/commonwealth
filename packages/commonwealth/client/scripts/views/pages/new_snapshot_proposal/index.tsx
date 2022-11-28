/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import NewProposalForm from './new_proposal_form';

type NewProposalSnapshotPageAttrs = { snapshotId: string };

class NewSnapshotProposalPage extends ClassComponent<NewProposalSnapshotPageAttrs> {
  view(vnode: m.Vnode<NewProposalSnapshotPageAttrs>) {
    return (
      <Sublayout
      // title="New Snapshot Proposal"
      >
        <div class="NewProposalPage">
          {m(NewProposalForm, { snapshotId: vnode.attrs.snapshotId })}
        </div>
      </Sublayout>
    );
  }
}

export default NewSnapshotProposalPage;
