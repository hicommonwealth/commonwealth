import 'pages/new_proposal_page.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { ProposalType, proposalSlugToClass, proposalSlugToFriendlyName } from 'identifiers';
import { ChainBase, ChainNetwork, ProposalModule } from 'models';
import NewProposalForm from 'views/pages/new_snapshot_proposal/new_proposal_form';
import PageNotFound from '../404';

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
