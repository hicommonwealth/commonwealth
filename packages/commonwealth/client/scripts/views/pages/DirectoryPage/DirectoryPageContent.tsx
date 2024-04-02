import NodeInfo from 'models/NodeInfo';
import React from 'react';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { ViewType } from 'views/pages/DirectoryPage/useDirectoryPageData';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './DirectoryPageContent.scss';

type RowType = {
  community: JSX.Element;
  name: string;
  nameLower: string;
  description: string;
  members: string;
  threads: string;
  iconUrl: string;
  id: string;
};

export type CommunityData = {
  name: string;
  nameLower: string;
  description: string;
  members: string;
  threads: string;
  iconUrl: string;
  id: string;
  namespace: string;
  ChainNode: NodeInfo;
};

interface DirectoryPageContentProps {
  isLoading: boolean;
  noFilteredCommunities: boolean;
  noCommunitiesInChain: boolean;
  chainName: string;
  communitySearch: string;
  selectedViewType: ViewType;
  tableData: RowType[];
  filteredRelatedCommunitiesData: CommunityData[];
}

const columnInfo = [
  {
    key: 'name',
    customElementKey: 'community',
    header: 'Community',
    numeric: false,
    sortable: true,
  },
  {
    key: 'description',
    header: 'Description',
    numeric: false,
    sortable: true,
  },
  {
    key: 'members',
    header: 'Members',
    numeric: true,
    sortable: true,
  },
  {
    key: 'threads',
    header: 'Threads',
    numeric: true,
    sortable: true,
  },
];

const DirectoryPageContent = ({
  isLoading,
  noFilteredCommunities,
  noCommunitiesInChain,
  chainName,
  communitySearch,
  selectedViewType,
  tableData,
  filteredRelatedCommunitiesData,
}: DirectoryPageContentProps) => {
  if (isLoading) {
    return (
      <div className="directory-loader-container">
        <CWCircleMultiplySpinner />
      </div>
    );
  }

  if (noCommunitiesInChain) {
    return (
      <CWText className="directory-empty-state">
        No communities found for chain <b>{chainName}</b>.
      </CWText>
    );
  }

  if (noFilteredCommunities && communitySearch) {
    return (
      <CWText className="directory-empty-state">
        No results found matching <b>{communitySearch}</b>.
      </CWText>
    );
  }

  return selectedViewType === ViewType.Rows ? (
    <CWTable
      columnInfo={columnInfo}
      rowData={tableData}
      defaultSortColumnKey="members"
    />
  ) : (
    <div className="directory-tiles-container">
      {filteredRelatedCommunitiesData.map((community) => (
        <CWRelatedCommunityCard
          key={community.id}
          community={app.config.chains.getById(community.id)}
          memberCount={community.members}
          threadCount={community.threads}
        />
      ))}
    </div>
  );
};

export default DirectoryPageContent;
