/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal_page.scss';

import Sublayout from 'views/sublayout';
import { NewSnapshotProposalForm } from './new_snapshot_proposal_form';

type NewProposalSnapshotPageAttrs = { snapshotId: string };

class NewSnapshotProposalPage extends ClassComponent<NewProposalSnapshotPageAttrs> {
  view(vnode: m.Vnode<NewProposalSnapshotPageAttrs>) {
    return (
      <Sublayout>
        <div class="NewProposalPage">
          <NewSnapshotProposalForm snapshotId={vnode.attrs.snapshotId} />
        </div>
      </Sublayout>
    );
  }
}

export default NewSnapshotProposalPage;
