import 'pages/commonwealth/collectives/list.scss';

import m from 'mithril';
import { Table, Button, Input } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { CollectiveDataType } from 'controllers/chain/ethereum/commonwealth/utils';

const RowContent: m.Component<
  { data: any; isCreator: boolean },
  { submitting: boolean; updating: boolean; newStrategy: string }
> = {
  oncreate: (vnode) => {
    vnode.state.newStrategy = '';
  },
  view: (vnode) => {
    const { data, isCreator } = vnode.attrs;

    return m('tr', [
      m('td', data.acceptedToken),
      m('td', data.strategy),
      m('td', data.totalFunding),
      isCreator &&
        m('td', [
          m(Input, {
            style: 'margin-right: 20px; min-width: 350px;',
            options: {
              name: 'name',
              placeholder: 'New Strategy Address',
              autofocus: true,
            },
            oninput: (e) => {
              vnode.state.newStrategy = e.target.value;
              m.redraw();
            },
          }),
          m(Button, {
            label: 'Update',
            disabled: vnode.state.newStrategy === '' || vnode.state.submitting,
            onclick: (e) => {
              e.preventDefault();

              vnode.state.submitting = true;
              // protocol.updateTokenStrategy()
              vnode.state.submitting = false;
            },
          }),
        ]),
    ]);
  },
};

const CollectiveContent: m.Component<
  {
    collective: CollectiveDataType;
    isCreator: boolean;
    detailedInfo: {
      acceptedToken: string;
      strategy: string;
      totalFunding: number;
    }[];
  },
  { submitting: boolean }
> = {
  view: (vnode) => {
    const { isCreator, detailedInfo } = vnode.attrs;

    const tableContents = detailedInfo.map((d: any) =>
      m(RowContent, { data: d, isCreator })
    );

    return m(
      Table,
      {
        interactive: true,
        striped: true,
      },
      m('tr', [
        m('th', 'Accepted Token'),
        m('th', 'Token Strategy'),
        m('th', 'Total Funded'),
        isCreator && m('th', 'Actions'),
      ]),
      tableContents
    );
  },
};

const CollectivePage: m.Component<
  { address: string },
  {
    initialized: boolean;
    collective: CollectiveDataType;
    detailedInfo: any;
    withdrawing: boolean;
  }
> = {
  oncreate: (vnode) => {
    vnode.state.initialized = false;
  },
  onupdate: async (vnode) => {
    if (!vnode.state.initialized && app.user.activeAccount) {
      vnode.state.initialized = true;
      vnode.state.collective = {
        creator: app.user.activeAccount.address || '0x01',
        beneficiary: app.user.activeAccount.address || '0x01',
        acceptedTokens: ['USDT', 'USDC', 'DAI'],
        strategies: ['0x01', '0x02', '0x03'],
        name: 'collective1',
        description: 'colletive description',
        ipfsHash: '',
      };
      vnode.state.detailedInfo = [
        {
          acceptedToken: 'USDT',
          strategy: '0x01',
          totalFunding: 100,
        },
        {
          acceptedToken: 'USDC',
          strategy: '0x02',
          totalFunding: 50,
        },
        {
          acceptedToken: 'DAI',
          strategy: '0x03',
          totalFunding: 200,
        },
      ];
      m.redraw();
    }

    // if (!protocolReady()) return;
    // if (!vnode.state.initialized) {
    //   vnode.state.collective =
    //     await app.cmnProtocol.collective_protocol.getCollectives(vnode.attrs.address);
    //   vnode.state.initialized = true;
    //   m.redraw();
    // }
  },

  view: (vnode) => {
    if (!vnode.state.initialized) return m(PageLoading);
    const notLoggedIn = !app.user.activeAccount || !app.isLoggedIn();

    let isCreator = false;
    let isBeneficiary = false;
    if (app.user.activeAccount.address && vnode.state.collective) {
      isBeneficiary =
        app.user.activeAccount.address === vnode.state.collective.beneficiary;
      isCreator =
        app.user.activeAccount.address === vnode.state.collective.creator;
    }

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
        !notLoggedIn &&
          vnode.state.collective &&
          m(CollectiveContent, {
            collective: vnode.state.collective,
            detailedInfo: vnode.state.detailedInfo,
            isCreator,
          }),
        isBeneficiary &&
          m(Button, {
            style: 'margin-top: 40px; max-width: 300px;',
            label: `Withdraw${vnode.state.withdrawing ? 'ing' : ''}`,
            disabled: vnode.state.withdrawing,
            rounded: true,
            fluid: true,
            intent: 'primary',
            onclick: (e) => {
              e.preventDefault();

              vnode.state.withdrawing = true;
              // protocol.widthdraw()
              vnode.state.withdrawing = false;
            },
          }),
      ]
    );
  },
};

export default CollectivePage;
