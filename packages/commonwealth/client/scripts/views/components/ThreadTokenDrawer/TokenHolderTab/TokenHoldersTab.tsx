import React from 'react';
import { APIOrderDirection } from '../../../../helpers/constants';
import { CWText } from '../../component_kit/cw_text';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../component_kit/new_designs/CWTable/useCWTableState';

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

export const TokenHoldersTab = () => {
  const tokenHolderTableState = useCWTableState({
    columns: tokenHolderColumns,
    initialSortColumn: 'balance',
    initialSortDirection: APIOrderDirection.Desc,
  });

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
};
