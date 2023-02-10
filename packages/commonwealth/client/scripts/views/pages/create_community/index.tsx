import React from 'react';

import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { CosmosForm } from './cosmos_form';
import { ERC20Form } from './erc20_form';
import { ERC721Form } from './erc721_form';
import { EthDaoForm } from './eth_dao_form';
import { SplTokenForm } from './spl_token_form';
import { SputnikForm } from './sputnik_form';
import { StarterCommunityForm } from './starter_community_form';
import { SubstrateForm } from './substrate_form';
import type { EthChainAttrs } from './types';

export enum CommunityType {
  StarterCommunity = 'Starter Community',
  Erc20Community = 'ERC20',
  Erc721Community = 'ERC721',
  SubstrateCommunity = 'Substrate',
  SputnikDao = 'Sputnik (V2)',
  Cosmos = 'Cosmos',
  EthDao = 'Compound/Aave',
  SplToken = 'Solana Token',
  AbiFactory = 'Abi Factory',
}

const ADMIN_ONLY_TABS = [
  CommunityType.SubstrateCommunity,
  CommunityType.Cosmos,
  CommunityType.EthDao,
  CommunityType.SputnikDao,
];

type CreateCommunityState = {
  activeForm: string;
  loadingEthChains: boolean;
} & EthChainAttrs;

class CreateCommunity extends ClassComponent {
  public state: CreateCommunityState = {
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
      redraw();
    });
  }

  view() {
    const getActiveForm = () => {
      const { ethChains, ethChainNames } = this.state;
      switch (this.state.activeForm) {
        case CommunityType.StarterCommunity:
          return <StarterCommunityForm />;
        case CommunityType.Erc20Community:
          return (
            <ERC20Form ethChains={ethChains} ethChainNames={ethChainNames} />
          );
        case CommunityType.Erc721Community:
          return (
            <ERC721Form ethChains={ethChains} ethChainNames={ethChainNames} />
          );
        case CommunityType.SputnikDao:
          return <SputnikForm />;
        case CommunityType.SubstrateCommunity:
          return <SubstrateForm />;
        case CommunityType.Cosmos:
          return <CosmosForm />;
        case CommunityType.EthDao:
          return (
            <EthDaoForm ethChains={ethChains} ethChainNames={ethChainNames} />
          );
        case CommunityType.SplToken:
          return <SplTokenForm />;
        default:
          throw new Error(`Invalid community type: ${this.state.activeForm}`);
      }
    };

    return this.state.loadingEthChains ? (
      <PageLoading />
    ) : (
      <Sublayout
      // title="Create Community"
      >
        <div className="CreateCommunityIndex">
          <CWText type="h3" fontWeight="semiBold">
            New Commonwealth Community
          </CWText>
          {!this.state.loadingEthChains && (
            <CWTabBar>
              {Object.values(CommunityType)
                .filter((t) => {
                  return !ADMIN_ONLY_TABS.includes(t) || app?.user.isSiteAdmin;
                })
                .map((t) => {
                  return (
                    <CWTab
                      label={t.toString()}
                      isSelected={this.state.activeForm === t}
                      onClick={() => {
                        this.state.activeForm = t;
                        mixpanelBrowserTrack({
                          event:
                            MixpanelCommunityCreationEvent.COMMUNITY_TYPE_CHOSEN,
                          chainBase: null,
                          isCustomDomain: app.isCustomDomain(),
                          communityType: t,
                        });
                      }}
                    />
                  );
                })}
            </CWTabBar>
          )}
          {!this.state.loadingEthChains && getActiveForm()}
        </div>
      </Sublayout>
    );
  }
}

export default CreateCommunity;
