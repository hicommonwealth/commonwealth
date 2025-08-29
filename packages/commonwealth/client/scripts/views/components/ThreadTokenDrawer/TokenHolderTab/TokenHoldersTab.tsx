import React from 'react';
import { APIOrderDirection } from '../../../../helpers/constants';
import { CWText } from '../../component_kit/cw_text';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../component_kit/new_designs/CWTable/useCWTableState';
import { TokenHolder, useTokenHolders } from './useTokenHolders';

interface TokenHoldersTabProps {
  threadId: number;
}

const tokenHolderColumns: CWTableColumnInfo[] = [
  {
    key: 'user',
    header: 'User',
    numeric: false,
    sortable: false,
  },
  {
    key: 'percentage',
    header: 'Percentage',
    numeric: true,
    sortable: true,
  },
];

export const TokenHoldersTab = ({ threadId }: TokenHoldersTabProps) => {
  const { tokenHolders, isLoading: isLoadingHolders } =
    useTokenHolders(threadId);

  const tokenHolderTableState = useCWTableState({
    columns: tokenHolderColumns,
    initialSortColumn: 'percentage',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const getTokenHolderRowData = (holders: TokenHolder[]) => {
    return holders.map((holder) => ({
      user: {
        sortValue: holder.name || 'Unknown',
        customElement: (
          <div className="user-info">
            <CWText type="b2">{holder.name || 'Unknown'}</CWText>
          </div>
        ),
      },
      percentage: `${holder.percentage.toFixed(2)}%`,
    }));
  };

  if (isLoadingHolders) {
    return (
      <div className="tab-content">
        <div className="empty-state">
          <CWText type="b1" className="empty-text">
            Loading token holders...
          </CWText>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {tokenHolders.length > 0 ? (
        <CWTable
          columnInfo={tokenHolderTableState.columns}
          sortingState={tokenHolderTableState.sorting}
          setSortingState={tokenHolderTableState.setSorting}
          rowData={getTokenHolderRowData(tokenHolders)}
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
