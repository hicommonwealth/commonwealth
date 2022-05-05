/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { Tabs, TabItem } from 'construct-ui';

import 'pages/create_community.scss';

import app from 'state';
import { CosmosForm } from './cosmos_form';
import { ERC20Form } from './erc20_form';
import { ERC721Form } from './erc721_form';
import { EthChainAttrs } from './types';
import { EthDaoForm } from './eth_dao_form';
import { SplTokenForm } from './spl_token_form';
import { SputnikForm } from './sputnik_form';
import { StarterCommunityForm } from './starter_community_form';
import { SubstrateForm } from './substrate_form';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityCreationPayload,
  MixpanelPageViewEvent,
  MixpanelPageViewPayload,
} from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

export enum CommunityType {
  StarterCommunity = 'Starter Community',
  Erc20Community = 'ERC20',
  Erc721Community = 'ERC721',
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

type CreateCommunityState = {
  activeForm: string;
  loadingEthChains: boolean;
} & EthChainAttrs;

class CreateCommunity implements m.ClassComponent {
  private state: CreateCommunityState = {
    activeForm: CommunityType.StarterCommunity,
    ethChainNames: {},
    ethChains: {},
    loadingEthChains: true,
  };

  oninit() {
    // query eth chains
    $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(async (res) => {
      if (res.status === 'Success') {
        this.state.ethChains = res.result;
      }

      // query names from chainlist if possible
      const chains = await $.getJSON('https://chainid.network/chains.json');
      for (const id of Object.keys(this.state.ethChains)) {
        const chain = chains.find((c) => c.chainId === +id);
        if (chain) {
          this.state.ethChainNames[id] = chain.name;
        }
      }
      this.state.loadingEthChains = false;
      m.redraw();
    });
  }

  oncreate() {
    mixpanelBrowserTrack({
      event: MixpanelPageViewEvent.COMMUNITY_CREATION_PAGE_VIEW,
    });
  }

  view() {
    const getActiveForm = () => {
      const { ethChains, ethChainNames } = this.state;
      switch (this.state.activeForm) {
        case CommunityType.StarterCommunity:
          return m(StarterCommunityForm);
        case CommunityType.Erc20Community:
          return m(ERC20Form, { ethChains, ethChainNames });
        case CommunityType.Erc721Community:
          return m(ERC721Form, { ethChains, ethChainNames });
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
          throw new Error(`Invalid community type: ${this.state.activeForm}`);
      }
    };

    return this.state.loadingEthChains ? (
      <PageLoading />
    ) : (
      <Sublayout title="Create Community">
        <div class="CreateCommunityIndex">
          <h3>New Commonwealth Community</h3>
          {!this.state.loadingEthChains && (
            <Tabs align="center" bordered={false} fluid={true}>
              {Object.values(CommunityType)
                .filter((t) => {
                  return !ADMIN_ONLY_TABS.includes(t) || app?.user.isSiteAdmin;
                })
                .map((t) => {
                  return (
                    <TabItem
                      label={t.toString()}
                      active={this.state.activeForm === t}
                      onclick={() => {
                        this.state.activeForm = t;
                        mixpanelBrowserTrack({
                          event:
                            MixpanelCommunityCreationEvent.COMMUNITY_TYPE_CHOSEN,
                          chainBase: null,
                          communityType: t,
                        });
                      }}
                      style="text-align: center"
                    />
                  );
                })}
            </Tabs>
          )}
          {!this.state.loadingEthChains && getActiveForm()}
        </div>
      </Sublayout>
    );
  }
}

export default CreateCommunity;
