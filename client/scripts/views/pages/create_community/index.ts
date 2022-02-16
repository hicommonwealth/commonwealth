import m from 'mithril';
import $ from 'jquery';
import { Tabs, TabItem, Spinner } from 'construct-ui';

import 'pages/create_community.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CosmosForm } from './cosmos_form';
import { ERC20Form } from './erc20_form';
import { EthChainAttrs } from './types';
import { EthDaoForm } from './eth_dao_form';
import { SplTokenForm } from './spl_token_form';
import { SputnikForm } from './sputnik_form';
import { StarterCommunityForm } from './starter_community_form';
import { SubstrateForm } from './substrate_form';

enum CommunityType {
  StarterCommunity = 'Starter Community',
  Erc20Community = 'ERC20',
  SubstrateCommunity = 'Substrate',
  SputnikDao = 'Sputnik (V2)',
  Cosmos = 'Cosmos',
  EthDao = 'Compound/Aave',
  SplToken = 'Solana Token',
}

const ADMIN_ONLY_TABS = [
  CommunityType.SubstrateCommunity,
  CommunityType.Cosmos,
  CommunityType.EthDao,
];

type CreateCommunityAttrs = Record<string, unknown>;

interface CreateCommunityState extends EthChainAttrs {
  activeForm: string;
  loadingEthChains: boolean;
}

const CreateCommunity: m.Component<CreateCommunityAttrs, CreateCommunityState> =
  {
    oninit: (vnode) => {
      vnode.state.activeForm = CommunityType.StarterCommunity;
      vnode.state.loadingEthChains = true;
      vnode.state.ethChains = {};
      vnode.state.ethChainNames = {};

      // query eth chains
      $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(
        async (res) => {
          if (res.status === 'Success') {
            vnode.state.ethChains = res.result;
          }

          // query names from chainlist if possible
          const chains = await $.getJSON('https://chainid.network/chains.json');
          for (const id of Object.keys(vnode.state.ethChains)) {
            const chain = chains.find((c) => c.chainId === +id);
            if (chain) {
              vnode.state.ethChainNames[id] = chain.name;
            }
          }
          vnode.state.loadingEthChains = false;
          m.redraw();
        }
      );
    },
    view: (vnode: m.VnodeDOM<CreateCommunityAttrs, CreateCommunityState>) => {
      const getActiveForm = () => {
        const { ethChains, ethChainNames } = vnode.state;
        switch (vnode.state.activeForm) {
          case CommunityType.StarterCommunity:
            return m(StarterCommunityForm);
          case CommunityType.Erc20Community:
            return m(ERC20Form, { ethChains, ethChainNames });
          case CommunityType.SputnikDao:
            return m(SputnikForm);
          case CommunityType.SubstrateCommunity:
            return m(SubstrateForm);
          case CommunityType.Cosmos:
            return m(CosmosForm);
          case CommunityType.EthDao:
            return m(EthDaoForm, { ethChains, ethChainNames });
          case CommunityType.SplToken:
            return m(SplTokenForm);
          default:
            throw new Error(
              `Invalid community type: ${vnode.state.activeForm}`
            );
        }
      };
      return m(
        Sublayout,
        {
          class: 'CreateCommunityPage',
          title: 'Create Community',
          useQuickSwitcher: true,
        },
        [
          m('.create-community-wrapper', [
            m('h3', 'New Commonwealth Community'),
            vnode.state.loadingEthChains &&
              m(Spinner, {
                fill: true,
                message: 'Loading...',
                size: 'xl',
                style: 'visibility: visible; opacity: 1;',
              }),
            !vnode.state.loadingEthChains &&
              m(
                Tabs,
                {
                  align: 'center',
                  bordered: false,
                  fluid: true,
                },
                Object.values(CommunityType)
                  .filter((t) => {
                    return (
                      !ADMIN_ONLY_TABS.includes(t) || app?.user.isSiteAdmin
                    );
                  })
                  .map((t) => {
                    return m(TabItem, {
                      label: t.toString(),
                      active: vnode.state.activeForm === t,
                      onclick: () => {
                        vnode.state.activeForm = t;
                      },
                      style: 'text-align: center',
                    });
                  })
              ),
            !vnode.state.loadingEthChains && getActiveForm(),
          ]),
        ]
      );
    },
  };

export default CreateCommunity;
