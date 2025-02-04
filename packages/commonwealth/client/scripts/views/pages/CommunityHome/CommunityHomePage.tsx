import app from 'client/scripts/state';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useRef, useState } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import ActiveContestList from '../HomePage/ActiveContestList/ActiveContestList';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import XpQuestList from '../HomePage/XpQuestList/XpQuestList';
import './CommunityHomePage.scss';
import CommunityTransactions from './CommunityTransactions/CommunityTransactions';
import TokenDetails from './TokenDetails/TokenDetails';

const testData = {
  token_address: '0x2aab7bc884aa28ba5b23f7abb5ba5068e93fe71c',
  namespace: 'ClippyChainsawRevenge',
  name: 'ClippyChainsawRevenge',
  symbol: 'CLPVR',
  initial_supply: 1000000000,
  liquidity_transferred: false,
  launchpad_liquidity: '430000000000000000000000000',
  eth_market_cap_target: 29.447347142468825,
  icon_url:
    'https://s3.amazonaws.com/local.assets/2fc0c99d-2482-41a6-bb8b-766779cc8838.png',
  description:
    'ClippyChainsawRevenge: because when your paperclip turns vigilante, your crypto portfolio should too. 📎🔪😂 Embrace the chaos!',
  created_at: '2024-11-25T12:31:10.059Z',
  updated_at: '2024-11-25T12:31:10.059Z',
  latest_price: null,
  old_price: null,
  community_id: 'clippychainsawrevenge-clpvr-community',
};

const CommunityHome = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const communityHomeEnabled = useFlag('communityHome');
  const chain = app.chain.meta.id;

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId] = useState<string>();

  return (
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="CommunityHome">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(communityHomeEnabled && { fontWeight: 'semiBold' })}
            >
              Community Home
            </CWText>
            <TokenDetails
              name={testData.name}
              symbol={testData.symbol}
              description={testData.description}
              priceChange={50.3}
              address={testData.token_address}
              marketCap={testData.eth_market_cap_target}
              members={1500}
              threads={236}
              iconUrl={testData.icon_url}
            />
          </div>
        </div>
        <ActiveContestList />
        <CommunityTransactions />
        <XpQuestList communityIdFilter={chain} />
        <TrendingThreadList
          query={useFetchGlobalActivityQuery}
          communityIdFilter={chain}
        />
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
              }
            />
          }
          // @ts-expect-error <StrictNullChecks/>
          onClose={() => setModeOfManageCommunityStakeModal(null)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunityHome;
