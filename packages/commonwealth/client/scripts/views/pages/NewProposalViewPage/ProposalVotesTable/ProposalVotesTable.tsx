import { APIOrderDirection } from 'client/scripts/helpers/constants';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTable } from 'client/scripts/views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'client/scripts/views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'client/scripts/views/components/component_kit/new_designs/CWTable/useCWTableState';
import React from 'react';
import app from 'state';
import { User } from 'views/components/user/user';
import './ProposalVotesTable.scss';
type ProposalVotesTableProps = {
  votes: any[];
  choices?: Array<string> | undefined;
};
const columns: CWTableColumnInfo[] = [
  {
    key: 'voter',
    header: 'User',
    numeric: false,
    sortable: true,
  },

  {
    key: 'choice',
    header: 'Vote',
    numeric: false,
    sortable: true,
  },
  {
    key: 'balance',
    header: 'Power',
    numeric: false,
    sortable: true,
  },
];
const ProposalVotesTable = ({ votes, choices }: ProposalVotesTableProps) => {
  const tableState = useCWTableState({
    columns: columns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return (
    <div className="ProposalVotesTable">
      {votes?.length ? (
        <>
          <CWTable
            columnInfo={tableState.columns}
            sortingState={tableState.sorting}
            setSortingState={tableState.setSorting}
            rowData={
              votes &&
              votes.map((reactor) => ({
                ...reactor,
                choice: {
                  customElement: (
                    <CWText className="column-text" noWrap>
                      {
                        // @ts-expect-error <StrictNullChecks/>
                        choices[reactor.choice]
                      }
                    </CWText>
                  ),
                },
                voter: {
                  sortValue: reactor.name,
                  customElement: (
                    <User
                      avatarSize={20}
                      userAddress={reactor.voter}
                      shouldLinkProfile
                      userCommunityId={app.activeChainId() || ''}
                    />
                  ),
                },
              }))
            }
          />
        </>
      ) : (
        <CWText className="empty-upvotes-container" type="b1">
          There are no votes to view.
        </CWText>
      )}
    </div>
  );
};

export default ProposalVotesTable;
