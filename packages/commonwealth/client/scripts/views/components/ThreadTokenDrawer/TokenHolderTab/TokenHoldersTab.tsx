import React from 'react';
import { APIOrderDirection } from '../../../../helpers/constants';
import { useGetThreadTokenHoldersQuery } from '../../../../state/api/tokens/getThreadTokenHolders';
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

interface TokenHoldersTabProps {
  threadId: number;
}

const tokenHolderColumns: CWTableColumnInfo[] = [
  {
    key: 'user',
    header: 'Username',
    numeric: false,
    sortable: true,
  },
  {
    key: 'percentage',
    header: 'Percentage',
    numeric: true,
    sortable: true,
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
];

export const TokenHoldersTab = ({ threadId }: TokenHoldersTabProps) => {
  const { data: holdersData, isLoading: isLoadingHolders } =
    useGetThreadTokenHoldersQuery(
      { thread_id: threadId },
      { enabled: !!threadId },
    );

  console.log('TokenHoldersTab - holdersData:', holdersData);
  console.log('TokenHoldersTab - isLoadingHolders:', isLoadingHolders);

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
          </div>
        ),
      },
      percentage: holder.percentage,
    }));
  };

  return (
    <div className="tab-content">
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
