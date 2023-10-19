import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import $ from 'jquery';
import 'pages/create_community.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CosmosForm } from './cosmos_form';
import { ERC20Form } from './erc20_form';
import { ERC721Form } from './erc721_form';
import { EthDaoForm } from './eth_dao_form';
import { useEthCommunityFormState } from './hooks';
import { SplTokenForm } from './spl_token_form';
import { SputnikForm } from './sputnik_form';
import { StarterCommunityForm } from './starter_community_form';
import { SubstrateForm } from './substrate_form';
import { PolygonForm } from './polygon_form';
import { useCommonNavigate } from 'navigation/helpers';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

export enum CommunityType {
  StarterCommunity = 'Starter Community',
  Erc20Community = 'ERC20',
  Erc721Community = 'ERC721',
  SubstrateCommunity = 'Substrate',
  SputnikDao = 'Sputnik (V2)',
  Cosmos = 'Cosmos',
  EthDao = 'Compound/Aave',
  SplToken = 'Solana Token',
  Polygon = 'Polygon',
  AbiFactory = 'Abi Factory',
}

const ADMIN_ONLY_TABS = [
  CommunityType.SubstrateCommunity,
  CommunityType.Cosmos,
  CommunityType.EthDao,
  CommunityType.SputnikDao,
];

export const ETHEREUM_MAINNET = 'Ethereum Mainnet';

type CreateCommunityProps = {
  type?: string;
};

const getFormType = (type: string) => {
  switch (type) {
    case 'starter':
      return CommunityType.StarterCommunity;
    case 'erc20':
      return CommunityType.Erc20Community;
    case 'erc721':
      return CommunityType.Erc721Community;
    case 'sputnik':
      return CommunityType.SputnikDao;
    case 'substrate':
      return CommunityType.SubstrateCommunity;
    case 'cosmos':
      return CommunityType.Cosmos;
    case 'ethdao':
      return CommunityType.EthDao;
    case 'polygon':
      return CommunityType.Polygon;
    case 'solana':
      return CommunityType.SplToken;
    default:
      return CommunityType.StarterCommunity;
  }
};

const getTypeUrl = (type: CommunityType): string => {
  switch (type) {
    case CommunityType.StarterCommunity:
      return 'starter';
    case CommunityType.Erc20Community:
      return 'erc20';
    case CommunityType.Erc721Community:
      return 'erc721';
    case CommunityType.SputnikDao:
      return 'sputnik';
    case CommunityType.SubstrateCommunity:
      return 'substrate';
    case CommunityType.Cosmos:
      return 'cosmos';
    case CommunityType.EthDao:
      return 'ethdao';
    case CommunityType.Polygon:
      return 'polygon';
    case CommunityType.SplToken:
      return 'solana';
    default:
      return 'starter';
  }
};

const CreateCommunity = (props: CreateCommunityProps) => {
  const { type } = props;
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!type) {
      navigate('/createCommunity/starter');
    } else {
      setCurrentForm(getFormType(type));
    }
  }, [type]);

  const [currentForm, setCurrentForm] = useState<CommunityType>(
    getFormType(type)
  );
  const {
    ethCommunities,
    setEthCommunities,
    ethCommunityNames,
    setEthCommunityNames,
  } = useEthCommunityFormState();

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.COMMUNITY_CREATION_PAGE_VIEW,
    },
  });

  useEffect(() => {
    const fetchEthCommunities = async () => {
      await $.get(`${app.serverUrl()}/getSupportedEthChains`, {}).then(
        (res) => {
          if (res.status === 'Success') {
            setEthCommunities(res.result);
          }
        }
      );
    };

    fetchEthCommunities();
  }, []);

  useNecessaryEffect(() => {
    const fetchEthCommunityNames = async () => {
      const communities = await $.getJSON(
        'https://chainid.network/chains.json'
      );

      const newObject = {};

      for (const id of Object.keys(ethCommunities)) {
        const community = communities.find((c) => c.chainId === +id);

        if (community) {
          newObject[id] = community.name;
        }
      }

      setEthCommunityNames(newObject);
    };

    fetchEthCommunityNames();
  }, [ethCommunities]);

  const getCurrentForm = () => {
    switch (type) {
      case 'starter':
        return <StarterCommunityForm />;
      case 'erc20':
        return (
          <ERC20Form
            ethCommunities={ethCommunities}
            ethCommunityNames={ethCommunityNames}
          />
        );
      case 'erc721':
        return (
          <ERC721Form
            ethCommunities={ethCommunities}
            ethCommunityNames={ethCommunityNames}
          />
        );
      case 'sputnik':
        return <SputnikForm />;
      case 'substrate':
        return <SubstrateForm />;
      case 'cosmos':
        return <CosmosForm />;
      case 'ethdao':
        return (
          <EthDaoForm
            ethCommunities={ethCommunities}
            ethCommunityNames={ethCommunityNames}
          />
        );
      case 'polygon':
        return (
          <PolygonForm
            ethCommunities={ethCommunities}
            ethCommunityNames={ethCommunityNames}
          />
        );
      case 'solana':
        return <SplTokenForm />;
      default:
        return <StarterCommunityForm />;
    }
  };

  return (
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
                  navigate(`/createCommunity/${getTypeUrl(t)}`);
                }}
              />
            );
          })}
      </CWTabBar>
      {Object.keys(ethCommunityNames).length !== 0 ? (
        getCurrentForm()
      ) : (
        <div className="SpinnerContainer">
          <CWSpinner />
        </div>
      )}
    </div>
  );
};

export default CreateCommunity;
