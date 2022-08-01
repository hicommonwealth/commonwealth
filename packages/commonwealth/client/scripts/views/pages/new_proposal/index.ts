import 'pages/new_proposal_page.scss';

import m from 'mithril';
import app from 'state';
import { navigateToSubpage } from 'app';

import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalType } from 'common-common/src/types';
import {
  proposalSlugToClass,
  proposalSlugToFriendlyName,
  chainToProposalSlug,
} from 'identifiers';
import { ProposalModule } from 'models';
import NewProposalForm from 'views/pages/new_proposal/new_proposal_form';
import { PageNotFound } from '../404';

const NewProposalPage: m.Component<{ type }, { typeEnum; titlePre }> = {
  view: (vnode) => {
    vnode.state.typeEnum = vnode.attrs.type;
    vnode.state.titlePre = 'New';

    // auto-redirect to the new thread page if sent here accidentally
    if (vnode.state.typeEnum === ProposalType.Thread) {
      navigateToSubpage('/new/discussion');
    }

    // wait for chain
    if (app.chain?.failed)
      return m(PageNotFound, {
        title: 'Wrong Ethereum Provider Network!',
        message: 'Change Metamask to point to Ethereum Mainnet',
      });
    if (!app.chain || !app.chain.loaded || !app.chain.meta)
      return m(PageLoading, { narrow: true, showNewProposalButton: true });

    // infer proposal type if possible
    if (!vnode.state.typeEnum) {
      try {
        vnode.state.typeEnum = chainToProposalSlug(app.chain.meta);
      } catch (e) {
        return m(PageNotFound, {
          title: 'Invalid Page',
          message: 'Cannot determine proposal type.',
        });
      }
    }

    // check if module is still initializing
    const c = proposalSlugToClass().get(vnode.state.typeEnum) as ProposalModule<
      any,
      any,
      any
    >;
    if (!c.ready) {
      app.chain.loadModules([c]);
      return m(PageLoading, { narrow: true, showNewProposalButton: true });
    }

    return m(
      Sublayout,
      {
        title: `${vnode.state.titlePre} ${proposalSlugToFriendlyName.get(
          vnode.state.typeEnum
        )}`,
        showNewProposalButton: true,
      },
      [
        m('.NewProposalPage', [
          m(
            'h3',
            `${vnode.state.titlePre} ${proposalSlugToFriendlyName.get(
              vnode.state.typeEnum
            )}`
          ),
          m(NewProposalForm, {
            typeEnum: vnode.state.typeEnum,
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
                vnode.state.typeEnum !== ProposalType.PhragmenCandidacy
              ) {
              }
            },
          }),
        ]),
      ]
    );
  },
};

export default NewProposalPage;
