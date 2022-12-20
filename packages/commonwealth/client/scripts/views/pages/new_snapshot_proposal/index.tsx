/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import NewProposalForm from './new_proposal_form';

type NewProposalSnapshotPageAttrs = { snapshotId: string };

class NewSnapshotProposalPage extends ClassComponent<NewProposalSnapshotPageAttrs> {
  view(vnode: ResultNode<NewProposalSnapshotPageAttrs>) {
    return (
      <Sublayout
      // title="New Snapshot Proposal"
      >
        <div class="NewProposalPage">
          {render(NewProposalForm, { snapshotId: vnode.attrs.snapshotId })}
        </div>
      </Sublayout>
    );
  }
}

export default NewSnapshotProposalPage;
