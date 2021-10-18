import 'pages/commonwealth/collectives/list.scss';

import m from 'mithril';
import { Button, Icons } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Listing from 'views/pages/listing';
import CollectiveCard from 'views/components/commonwealth/collective_card';
import { CMNCollective } from 'models';

const CollectivesPage: m.Component<
  undefined,
  { initialized: boolean; collectives: CMNCollective[] }
> = {
  oncreate: (vnode) => {
    // vnode.state.initialized = false;
    vnode.state.initialized = true;
  },
  onupdate: async (vnode) => {
    // if (!protocolReady()) return;
    // if (!vnode.state.initialized) {
    //   vnode.state.collectives =
    //     await app.cmnProtocol.collective_protocol.getCollectives();
    //   vnode.state.initialized = true;
    //   m.redraw();
    // }
  },

  view: (vnode) => {
    if (!vnode.state.initialized) return m(PageLoading);
    const notLoggedIn = !app.user.activeAccount || !app.isLoggedIn();

    const collectiveContents = (vnode.state.collectives || []).map((c) =>
      m(CollectiveCard, { collective: c })
    );

    return m(
      Sublayout,
      {
        class: 'CollectivesPage',
        title: 'Collectives',
        showNewProposalButton: true,
      },
      [
        m('.stats-box', [
          m('div', 'CMN Protocol Page'),
          m('br'),
          notLoggedIn && m('div', 'Please login first'),
        ]),
        m('.new-button-row', [
          m(Button, {
            iconLeft: Icons.PLUS,
            fluid: true,
            label: 'Create a new Collective',
            compact: true,
            size: 'default',
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${app.activeChainId()}/new/collective`);
            },
          }),
        ]),
        m(Listing, {
          content: collectiveContents,
          columnHeader: `${
            collectiveContents.length === 0 ? 'No' : ''
          } Active Collectives`,
        }),
      ]
    );
  },
};

export default CollectivesPage;
