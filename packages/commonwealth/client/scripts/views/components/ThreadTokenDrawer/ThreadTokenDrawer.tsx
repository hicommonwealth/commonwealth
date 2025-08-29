import React, { Dispatch, SetStateAction, useState } from 'react';
import { useGetThreadTokenTradesQuery } from '../../../state/api/tokens';
import { CWText } from '../component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from '../component_kit/new_designs/CWDrawer';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import './ThreadTokenDrawer.scss';
import { TokenHoldersTab } from './TokenHolderTab/TokenHoldersTab';
import { TradeActivityTab } from './TradeActivityTab/TradeActivityTab';

type ThreadTokenDrawerProps = {
  threadId: number;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

const tabs = [
  { id: 'token-holders', label: 'Token Holders' },
  { id: 'trade-activity', label: 'Trade Activity' },
];

export const ThreadTokenDrawer = ({
  threadId,
  isOpen,
  setIsOpen,
}: ThreadTokenDrawerProps) => {
  const [activeTab, setActiveTab] = useState('trade-activity');

  const { data: tradesData, isLoading: isLoadingTrades } =
    useGetThreadTokenTradesQuery(
      {
        thread_id: threadId,
      },
      {
        enabled: isOpen && !!threadId,
      },
    );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trade-activity':
        return (
          <TradeActivityTab
            tradesData={tradesData}
            isLoadingTrades={isLoadingTrades}
          />
        );

      case 'token-holders':
        return <TokenHoldersTab threadId={threadId} />;

      default:
        return null;
    }
  };

  return (
    <div className="ThreadTokenDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="thread-token-drawer"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <CWDrawerTopBar onClose={() => setIsOpen(false)} />

        <div className="content-container">
          <CWText type="h3" className="drawer-header">
            Activity
          </CWText>

          <CWTabsRow className="tabs-container">
            {tabs.map((tab) => (
              <CWTab
                key={tab.id}
                label={tab.label}
                isSelected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </CWTabsRow>

          <div className="tab-content-wrapper">{renderTabContent()}</div>
        </div>
      </CWDrawer>
    </div>
  );
};
