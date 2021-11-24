import 'pages/create_community.scss';

import m from 'mithril';
import { Tabs, TabItem } from 'construct-ui';
import Sublayout from 'views/sublayout';
import OffchainCommunityForm from './offchain_community_form';
import ERC20Form from './erc20_form';
import SubstrateForm from './substrate_form';
import SputnikForm from './sputnik_form';
import CosmosForm from './cosmos_form';
import EthDaoForm from './eth_dao_form';

enum CommunityType {
  OffchainCommunity = 'Offchain Community',
  Erc20Community = 'ERC20',
  SubstrateCommunity = 'Substrate',
  SputnikDao = 'Sputnik (V2)',
  Cosmos = 'Cosmos',
  EthDao = 'Compound/Aave',
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
    const getActiveForm = (): m.Component => {
      switch (vnode.state.activeForm) {
        case CommunityType.OffchainCommunity:
          return OffchainCommunityForm;
        case CommunityType.Erc20Community:
          return ERC20Form;
        case CommunityType.SputnikDao:
          return SputnikForm;
        case CommunityType.SubstrateCommunity:
          return SubstrateForm;
        case CommunityType.Cosmos:
          return CosmosForm;
        case CommunityType.EthDao:
          return EthDaoForm;
        default:
          throw new Error(`Invalid community type: ${vnode.state.activeForm}`)
      }
    };
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
          Object.values(CommunityType).map((t) => {
            return m(TabItem, {
              label: t.toString(),
              active: vnode.state.activeForm === t,
              onclick: () => {
                vnode.state.activeForm = t;
              },
              style: 'text-align: center'
            })
          }),
        ),
        m('.community-creation-form', [ m(getActiveForm()) ]),
      ])
    ]);
  },
};

export default CreateCommunity;
