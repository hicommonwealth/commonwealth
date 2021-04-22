import 'pages/new_proposal_page.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import {
  ProposalType,
  proposalSlugToClass,
  proposalSlugToFriendlyName,
} from 'identifiers';
import { ChainBase, ChainNetwork, ProposalModule } from 'models';
import NewProposalForm from 'views/pages/new_proposal/new_proposal_form';
import PageNotFound from '../404';

const NewProposalPage: m.Component<{ type }, { typeEnum; titlePre }> = {
  view: (vnode) => {
    vnode.state.typeEnum = vnode.attrs.type;
    vnode.state.titlePre = 'New';

    // wait for chain if not offchain
    if (vnode.state.typeEnum !== ProposalType.OffchainThread) {
      if (app.chain?.failed)
        return m(PageNotFound, {
          title: 'Wrong Ethereum Provider Network!',
          message: 'Change Metamask to point to Ethereum Mainnet',
        });
      if (!app.chain || !app.chain.loaded)
        return m(PageLoading, { narrow: true, showNewProposalButton: true });

      // check if module is still initializing
      const c = proposalSlugToClass().get(
        vnode.state.typeEnum
      ) as ProposalModule<any, any, any>;
      if (!c.ready) {
        app.chain.loadModules([c]);
        return m(PageLoading, { narrow: true, showNewProposalButton: true });
      }
    }

    return m(
      Sublayout,
      {
        class: 'NewProposalPage',
        title: `${vnode.state.titlePre} ${proposalSlugToFriendlyName.get(
          vnode.state.typeEnum
        )}`,
        showNewProposalButton: true,
      },
      [
        m('.forum-container', [
          m(NewProposalForm, {
            typeEnum: vnode.attrs.type,
            onChangeSlugEnum: (value) => {
              if (value !== 'proposal') {
                vnode.state.titlePre = 'Note';
              } else {
                vnode.state.titlePre = 'New';
              }
              vnode.state.typeEnum = `democracy${value}`;
              m.redraw();
            },
            callback: (proposal) => {
              if (
                proposal &&
                vnode.attrs.type !== ProposalType.PhragmenCandidacy
              ) {
                mixpanel.track('Create Thread', {
                  'Step No': 3,
                  Step: 'Transaction Signed',
                  'Thread Type': 'Proposal',
                  ProposalID: proposal.slug,
                  Scope: app.activeId(),
                  user: app.user.activeAccount.address,
                });
                mixpanel.people.increment('Thread');
                mixpanel.people.set({
                  'Last Thread Created': new Date().toISOString(),
                });
              }
            },
          }),
        ]),
      ]
    );
  },
};

export default NewProposalPage;
