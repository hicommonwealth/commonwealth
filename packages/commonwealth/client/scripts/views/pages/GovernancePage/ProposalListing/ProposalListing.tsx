import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposal } from 'client/scripts/controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useGetSnapshotProposalsQuery } from 'client/scripts/state/api/snapshots';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList';
import { CWTable } from 'client/scripts/views/components/component_kit/new_designs/CWTable';
import {
  CWTab,
  CWTabsRow,
} from 'client/scripts/views/components/component_kit/new_designs/CWTabs';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { GridComponents, VirtuosoGrid } from 'react-virtuoso';
import { smartTrim } from 'shared/utils';
import { ListContainerProps } from '../../discussions/DiscussionsPage';
import { PageLoading } from '../../loading';
import ProposalCard from './ProposalCard/ProposalCard';
import './ProposalListing.scss';

type OptionType = {
  value: string;
  label: string;
};

interface UnifiedProposal {
  title: string;
  status: string;
}

const filterOptions: OptionType[] = [
  { label: 'All Proposals', value: 'all' },
  { label: 'In Voting', value: 'voting' },
  { label: 'Ended', value: 'ended' },
  { label: 'Upcoming', value: 'upcoming' },
];

const columnInfo = [
  { key: 'proposal', header: 'Proposal', numeric: false, sortable: false },
  { key: 'votes', header: 'Votes', numeric: false, sortable: true },
  { key: 'status', header: 'Status', numeric: false, sortable: true },
  { key: 'quorum', header: 'Quorum', numeric: false, sortable: true },
  { key: 'comment', header: 'Comments', numeric: false, sortable: true },
];

interface ProposalListingProps {
  activeCosmosProposals: CosmosProposal[] | undefined;
  completedCosmosProposals: CosmosProposal[] | undefined;
  chain: ChainBase.CosmosSDK | ChainBase.Ethereum;
}

const ProposalListing = ({
  activeCosmosProposals,
  completedCosmosProposals,
  chain,
}: ProposalListingProps) => {
  const communityId = app.activeChainId() || '';

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const communitySnapshotsts = useMemo(
    () => community?.snapshot_spaces || [],
    [community],
  );
  const snapshots: OptionType[] = useMemo(
    () =>
      communitySnapshotsts.map((space) => ({
        label: space,
        value: space,
      })),
    [communitySnapshotsts],
  );

  const [view, setView] = useState<'table' | 'card'>('table');
  const [snapshot] = useState<OptionType>(
    snapshots[0] || { label: '', value: '' },
  );
  const [filter, setFilter] = useState<OptionType>(filterOptions[0]);

  const { data: snapshotProposals, isLoading: isSnapshotProposalsLoading } =
    useGetSnapshotProposalsQuery({
      space: snapshot.value,
      enabled: !!snapshot.value,
    });

  const unifiedProposals: UnifiedProposal[] = useMemo(() => {
    if (chain === ChainBase.CosmosSDK) {
      const cosmosProposals = [
        ...(activeCosmosProposals || []),
        ...(completedCosmosProposals || []),
      ];

      return cosmosProposals.map((proposal) => ({
        title: proposal.title,
        status: proposal.data.state.status,
      }));
    } else if (chain === ChainBase.Ethereum) {
      if (snapshotProposals) {
        return snapshotProposals.map((proposal) => ({
          title: proposal.title,
          status: proposal.state,
        }));
      }
      return [];
    }
    return [];
  }, [
    activeCosmosProposals,
    completedCosmosProposals,
    snapshotProposals,
    chain,
  ]);

  const rowData = useMemo(
    () =>
      unifiedProposals.map((proposal) => ({
        proposal: (
          <div style={{ whiteSpace: 'nowrap' }}>
            <CWTag label={proposal.status} type="proposal" />
            <CWText fontWeight="semiBold">
              {smartTrim(proposal.title, 30)}
            </CWText>
          </div>
        ),
        votes: (
          <CWText fontWeight="regular" type="caption">
            N/A
          </CWText>
        ),
        status: (
          <div style={{ whiteSpace: 'nowrap' }}>
            <CWText fontWeight="regular" type="caption">
              {proposal?.status || ''}
            </CWText>
          </div>
        ),
        quorum: (
          <div style={{ whiteSpace: 'nowrap' }}>
            <CWText fontWeight="regular" type="caption">
              N/A
            </CWText>
          </div>
        ),
        comment: (
          <div style={{ whiteSpace: 'nowrap' }}>
            <CWText fontWeight="regular" type="caption">
              No linked proposals found
            </CWText>
          </div>
        ),
      })),
    [unifiedProposals],
  );

  const handleSnapshotChange = () => {};

  const handleFilterChange = useCallback((selected: OptionType | null) => {
    if (selected) setFilter(selected);
  }, []);

  const TableComponent = useMemo(() => {
    return <CWTable columnInfo={columnInfo} rowData={rowData} />;
  }, [rowData]);

  if (chain === ChainBase.Ethereum && isSnapshotProposalsLoading) {
    return <PageLoading message="Connecting to chain" />;
  }

  return (
    <div className="ProposalListing">
      <div className="proposal-header">
        <div className="snapshot">
          <div className="dropdown-container">
            <CWSelectList<OptionType>
              options={snapshots}
              defaultValue={snapshot}
              onChange={handleSnapshotChange}
            />
          </div>
          <CWTabsRow>
            <CWTab
              label={<></>}
              iconLeft="listDashes"
              isSelected={view === 'table'}
              onClick={() => setView('table')}
            />
            <CWTab
              label={<></>}
              iconLeft="kanban"
              isSelected={view === 'card'}
              onClick={() => setView('card')}
            />
          </CWTabsRow>
        </div>
        <div className="filter-dropdown-container">
          <CWSelectList<OptionType>
            options={filterOptions}
            defaultValue={filter}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      <div className="view-container">
        {view === 'table' ? (
          <>{TableComponent}</>
        ) : (
          <>
            <VirtuosoGrid
              data={unifiedProposals}
              components={
                {
                  List: (() => {
                    // eslint-disable-next-line react/no-multi-comp
                    const GridContainer = forwardRef<
                      HTMLDivElement,
                      ListContainerProps
                    >(({ children, ...props }, ref) => (
                      <div
                        ref={ref}
                        {...props}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(210px, 1fr))',
                          gap: '16px',
                          padding: '16px',
                        }}
                      >
                        {children}
                      </div>
                    ));
                    GridContainer.displayName = 'GridContainer';
                    return GridContainer;
                  })(),
                  Item: (() => {
                    const GridItem: React.FC<
                      React.HTMLAttributes<HTMLDivElement>
                      // eslint-disable-next-line react/no-multi-comp
                    > = ({ children, ...props }) => (
                      <div {...props}>{children}</div>
                    );
                    return GridItem;
                  })(),
                } as GridComponents
              }
              itemContent={(_, item: UnifiedProposal) => (
                <ProposalCard status={item.status} title={item.title} />
              )}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProposalListing;
