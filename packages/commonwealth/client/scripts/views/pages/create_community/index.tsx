import React, { useEffect, useState } from 'react';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import Sublayout from '../../Sublayout';
import { CosmosForm } from './cosmos_form';
import { ERC20Form } from './erc20_form';
import { ERC721Form } from './erc721_form';
import { EthDaoForm } from './eth_dao_form';
import { SplTokenForm } from './spl_token_form';
import { SputnikForm } from './sputnik_form';
import { StarterCommunityForm } from './starter_community_form';
import { SubstrateForm } from './substrate_form';
import { useEthChainFormState } from './hooks';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';

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

const CreateCommunity = () => {
  const [currentForm, setCurrentForm] = useState<CommunityType>(
    CommunityType.StarterCommunity
  );
  const { ethChains, setEthChains, ethChainNames, setEthChainNames } =
    useEthChainFormState();

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelPageViewEvent.COMMUNITY_CREATION_PAGE_VIEW },
  });

  useEffect(() => {
    const fetchEthChains = async () => {
      await $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(
        (res) => {
          if (res.status === 'Success') {
            setEthChains(res.result);
          }
        }
      );
    };

    fetchEthChains();
  }, []);

  useEffect(() => {
    const fetchEthChainNames = async () => {
      const chains = await $.getJSON('https://chainid.network/chains.json');

      const newObject = {};

      for (const id of Object.keys(ethChains)) {
        const chain = chains.find((c) => c.chainId === +id);

        if (chain) {
          newObject[id] = chain.name;
        }
      }

      setEthChainNames(newObject);
    };

    fetchEthChainNames();
  }, [ethChains]);

  const getCurrentForm = () => {
    switch (currentForm) {
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
        throw new Error(`Invalid community type: ${currentForm}`);
    }
  };

  return (
    <Sublayout>
      <div className="CreateCommunityIndex">
        <CWText type="h3" fontWeight="semiBold">
          New Commonwealth Community
        </CWText>
        <CWTabBar>
          {Object.values(CommunityType)
            .filter((t) => {
              return (
                (!ADMIN_ONLY_TABS.includes(t) || app?.user.isSiteAdmin) &&
                t !== CommunityType.AbiFactory
              );
            })
            .map((t, i) => {
              return (
                <CWTab
                  key={i}
                  label={t.toString()}
                  isSelected={currentForm === t}
                  onClick={() => {
                    setCurrentForm(t);
                  }}
                />
              );
            })}
        </CWTabBar>
        {getCurrentForm()}
      </div>
    </Sublayout>
  );
};

export default CreateCommunity;
