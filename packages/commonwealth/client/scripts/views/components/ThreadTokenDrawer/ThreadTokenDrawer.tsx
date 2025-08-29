import React, { Dispatch, SetStateAction, useState } from 'react';
import { APIOrderDirection } from '../../../helpers/constants';
import { CWText } from '../component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from '../component_kit/new_designs/CWDrawer';
import { CWTable } from '../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../component_kit/new_designs/CWTable/useCWTableState';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import './ThreadTokenDrawer.scss';

type ThreadTokenDrawerProps = {
  threadId: number;
  communityId: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

type TradeActivity = {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  price: string;
  timestamp: string;
  user: {
    name: string;
    avatarUrl: string;
    address: string;
  };
};

type TokenHolder = {
  id: string;
  address: string;
  balance: string;
  percentage: string;
  lastActivity: string;
  user: {
    name: string;
    avatarUrl: string;
  };
};

const tradeActivityColumns: CWTableColumnInfo[] = [
  {
    key: 'user',
    header: 'User',
    numeric: false,
    sortable: true,
  },
  {
    key: 'type',
    header: 'Type',
    numeric: false,
    sortable: true,
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    sortable: true,
  },
  {
    key: 'price',
    header: 'Price',
    numeric: true,
    sortable: true,
  },
  {
    key: 'timestamp',
    header: 'Time',
    numeric: true,
    sortable: true,
    chronological: true,
  },
];

const tokenHolderColumns: CWTableColumnInfo[] = [
  {
    key: 'user',
    header: 'Holder',
    numeric: false,
    sortable: true,
  },
  {
    key: 'balance',
    header: 'Balance',
    numeric: true,
    sortable: true,
  },
  {
    key: 'percentage',
    header: 'Percentage',
    numeric: true,
    sortable: true,
  },
  {
    key: 'lastActivity',
    header: 'Last Activity',
    numeric: true,
    sortable: true,
    chronological: true,
  },
];

const mockTradeActivity: TradeActivity[] = [
  {
    id: '1',
    type: 'buy',
    amount: '1000',
    price: '0.001 ETH',
    timestamp: '2024-01-15T10:30:00Z',
    user: {
      name: 'Alice',
      avatarUrl: '',
      address: '0x1234...5678',
    },
  },
  {
    id: '2',
    type: 'sell',
    amount: '500',
    price: '0.0012 ETH',
    timestamp: '2024-01-15T09:15:00Z',
    user: {
      name: 'Bob',
      avatarUrl: '',
      address: '0x8765...4321',
    },
  },
  {
    id: '3',
    type: 'buy',
    amount: '2000',
    price: '0.0009 ETH',
    timestamp: '2024-01-15T08:45:00Z',
    user: {
      name: 'Charlie',
      avatarUrl: '',
      address: '0xabcd...efgh',
    },
  },
];

const mockTokenHolders: TokenHolder[] = [
  {
    id: '1',
    address: '0x1234...5678',
    balance: '5000',
    percentage: '25%',
    lastActivity: '2024-01-15T10:30:00Z',
    user: {
      name: 'Alice',
      avatarUrl: '',
    },
  },
  {
    id: '2',
    address: '0x8765...4321',
    balance: '3000',
    percentage: '15%',
    lastActivity: '2024-01-15T09:15:00Z',
    user: {
      name: 'Bob',
      avatarUrl: '',
    },
  },
  {
    id: '3',
    address: '0xabcd...efgh',
    balance: '2000',
    percentage: '10%',
    lastActivity: '2024-01-15T08:45:00Z',
    user: {
      name: 'Charlie',
      avatarUrl: '',
    },
  },
];

const tabs = [
  {
    id: 'trade-activity',
    label: 'Trade Activity',
    iconLeft: 'chartLineUp' as const,
  },
  { id: 'token-holders', label: 'Token Holders', iconLeft: 'users' as const },
];

export const ThreadTokenDrawer = ({
  threadId,
  communityId,
  isOpen,
  setIsOpen,
}: ThreadTokenDrawerProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const tradeActivityTableState = useCWTableState({
    columns: tradeActivityColumns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const tokenHolderTableState = useCWTableState({
    columns: tokenHolderColumns,
    initialSortColumn: 'balance',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const getTradeActivityRowData = (activities: TradeActivity[]) => {
    return activities.map((activity) => ({
      user: {
        sortValue: activity.user.name,
        customElement: (
          <div className="user-info">
            <CWText type="b2">{activity.user.name}</CWText>
            <CWText type="caption" className="address">
              {activity.user.address}
            </CWText>
          </div>
        ),
      },
      type: {
        sortValue: activity.type,
        customElement: (
          <div className={`trade-type ${activity.type}`}>
            <CWText type="b2" className={activity.type}>
              {activity.type.toUpperCase()}
            </CWText>
          </div>
        ),
      },
      amount: activity.amount,
      price: activity.price,
      timestamp: activity.timestamp,
    }));
  };

  const getTokenHolderRowData = (holders: TokenHolder[]) => {
    return holders.map((holder) => ({
      user: {
        sortValue: holder.user.name,
        customElement: (
          <div className="user-info">
            <CWText type="b2">{holder.user.name}</CWText>
            <CWText type="caption" className="address">
              {holder.address}
            </CWText>
          </div>
        ),
      },
      balance: holder.balance,
      percentage: holder.percentage,
      lastActivity: holder.lastActivity,
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trade-activity':
        return (
          <div className="tab-content">
            <CWText type="h4" className="tab-header">
              Recent Trade Activity
            </CWText>
            {mockTradeActivity.length > 0 ? (
              <CWTable
                columnInfo={tradeActivityTableState.columns}
                sortingState={tradeActivityTableState.sorting}
                setSortingState={tradeActivityTableState.setSorting}
                rowData={getTradeActivityRowData(mockTradeActivity)}
              />
            ) : (
              <div className="empty-state">
                <CWText type="b1" className="empty-text">
                  No trade activity yet.
                </CWText>
              </div>
            )}
          </div>
        );

      case 'token-holders':
        return (
          <div className="tab-content">
            <CWText type="h4" className="tab-header">
              Token Holders
            </CWText>
            {mockTokenHolders.length > 0 ? (
              <CWTable
                columnInfo={tokenHolderTableState.columns}
                sortingState={tokenHolderTableState.sorting}
                setSortingState={tokenHolderTableState.setSorting}
                rowData={getTokenHolderRowData(mockTokenHolders)}
              />
            ) : (
              <div className="empty-state">
                <CWText type="b1" className="empty-text">
                  No token holders yet.
                </CWText>
              </div>
            )}
          </div>
        );

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
            Thread Token
          </CWText>

          <CWTabsRow className="tabs-container">
            {tabs.map((tab) => (
              <CWTab
                key={tab.id}
                label={tab.label}
                iconLeft={tab.iconLeft}
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
