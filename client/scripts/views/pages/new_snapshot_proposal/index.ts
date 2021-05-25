import 'pages/new_proposal_page.scss';

import m from 'mithril';

import Sublayout from 'views/sublayout';
import NewProposalForm from 'views/pages/new_snapshot_proposal/new_proposal_form';

const NewSnapshotProposalPage: m.Component<{}> = {
  view: (vnode) => {

    return m(Sublayout, {
      class: 'NewProposalPage',
      title: `New Snapshot Proposal`,
      showNewProposalButton: true,
    }, [
      m('.forum-container', [
        m(NewProposalForm, {}),
      ])
    ]);
  }
};

export default NewSnapshotProposalPage;
