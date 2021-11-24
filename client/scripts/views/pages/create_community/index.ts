import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Tabs, TabItem } from 'construct-ui';
import Sublayout from 'views/sublayout';
import OffchainCommunityForm from './offchain_community_form';
import ERC20Form from './erc20_form';
import SubstrateForm from './substrate_form';
import SputnikForm from './sputnik_form';

enum CommunityType {
  OffchainCommunity = 'offchain',
  Erc20Community = 'erc20',
  SubstrateCommunity = 'substrate',
  SputnikDao = 'sputnik',
}

type CreateCommunityAttrs = Record<string, unknown>;

interface CreateCommunityState {
  activeForm: string;
}

const CreateCommunity: m.Component<
  CreateCommunityAttrs,
  CreateCommunityState
> = {
  oninit: (vnode) => {
    vnode.state.activeForm = CommunityType.OffchainCommunity;
  },
  view: (vnode: m.VnodeDOM<CreateCommunityAttrs, CreateCommunityState>) => {
    return m(Sublayout, {
      class: 'CreateCommunityPage',
      title: 'Create Community',
      useQuickSwitcher: true,
    }, [
      m('.create-community-wrapper', [
        m('h3', 'New Commonwealth Community'),
        m(
          Tabs,
          {
            align: 'center',
            bordered: false,
            fluid: true,
          },
          [
            m(TabItem, {
              label: 'Offchain Community',
              active: vnode.state.activeForm === CommunityType.OffchainCommunity,
              onclick: () => {
                vnode.state.activeForm = 'offchain';
                return null;
              },
              style: 'text-align: center'
            }),
            m(TabItem, {
              label: 'ERC20',
              active: vnode.state.activeForm === CommunityType.Erc20Community,
              onclick: () => {
                vnode.state.activeForm = 'erc20';
                return null;
              },
              style: 'text-align: center'
            }),
            app.user.isSiteAdmin &&
              m(TabItem, {
                label: 'Substrate',
                active:
                  vnode.state.activeForm === CommunityType.SubstrateCommunity,
                onclick: () => {
                  vnode.state.activeForm = 'substrate';
                  return null;
                },
                style: 'text-align: center'
              }),
            m(TabItem, {
              label: 'Sputnik (V2)',
              active: vnode.state.activeForm === 'sputnik',
              onclick: () => {
                vnode.state.activeForm = 'sputnik';
                return null;
              },
              style: 'text-align: center'
            }),
          ]
        ),
        vnode.state.activeForm === CommunityType.OffchainCommunity &&
          m(OffchainCommunityForm),
        vnode.state.activeForm === CommunityType.Erc20Community && m(ERC20Form),
        vnode.state.activeForm === CommunityType.SubstrateCommunity &&
          m(SubstrateForm),
        vnode.state.activeForm === CommunityType.SputnikDao && m(SputnikForm),
      ])
    ]);
  },
};

export default CreateCommunity;
