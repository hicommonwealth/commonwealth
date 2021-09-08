/* eslint-disable no-mixed-operators */

import m from 'mithril';
import { utils } from 'ethers';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { CMNCollective } from 'models';

const CollectiveContentModule: m.Component<
  {
    collective: CMNCollective;
  },
  {}
> = {
  view: (vnode) => {
    const { collective } = vnode.attrs;
    return m('.col-lg-8 .content-area', [
      m('div.collective-name', collective.name),
      m('div.collective-text', [m('span', 'A collective created by'), m('span.bold', ` ${collective.creator}`)]),
      m('div.collective-description', collective.description)
    ]);
  }
};

const ViewCollectivePage: m.Component<
  {
    collectiveHash: string;
  },
  {
    initialized: boolean;
    collective: CMNCollective;
  }
> = {
  oncreate: async (vnode) => {
    vnode.state.initialized = false;
  },
  onupdate: async (vnode) => {
    if (!app.chain || vnode.state.initialized) return;

    const collective_protocol = (app.chain as any).collective_protocol;
    if (!collective_protocol || !collective_protocol.initialized || !collective_protocol.collectiveStore) return;

    const collectives = await collective_protocol.syncCollectives();
    const collective = collectives.filter((item) => item.collectiveHash === vnode.attrs.collectiveHash)[0];
    // await collective_protocol.syncMembers(collective.bToken)
    vnode.state.collective = collective;
    vnode.state.initialized = true;
    m.redraw();
  },
  view: (vnode) => {
    const { collective, initialized } = vnode.state;

    if (!initialized) {
      return m(PageLoading);
    }

    const collective_protocol = (app.chain as any).collective_protocol;
    const mStore = collective_protocol.memberStore.getById(collective.ipfsHash);
    const backers = mStore.backers || [];

    const backersContent = backers.map((backer) => m('.member', [m('.text', backer.address), m('.text', `${utils.formatEther(backer.balance)}ETH`)]));

    return m(
      Sublayout,
      {
        class: 'CollectivePage',
        title: 'Collectives',
        showNewProposalButton: true
      },
      [
        m('.container', [
          m('.row', [
            m(CollectiveContentModule, {
              collective
            })
          ]),
          m('.row .members-card', [
            m('.col-lg-6', [
              m('.title', 'Backers'),
              m('.text .mt-10px', 'Backer funds will go to the project if the funding threshold is reached.'),
              backersContent
            ])
          ])
        ])
      ]
    );
  }
};

export default ViewCollectivePage;
